use std::{collections::HashMap, sync::mpsc, thread, time};

use rand::Rng;
use serde_json::json;
use tauri::{async_runtime, command, AppHandle, Manager, State, Window};

use crate::{builds, cmd, page_data, state, web};

#[command]
pub fn toggle_rune_window(window: Window) {
    let payload = json!({
        "action": "toggle_rune_window",
    });
    window.trigger("global_events", Some(payload.to_string()));
}

#[command]
pub fn random_runes(handle: AppHandle, state: State<'_, state::GlobalState>) {
    let s = state.0.lock().unwrap();
    let p = s.page_data.lock().unwrap();

    let mut rng = rand::thread_rng();
    let mut i = rng.gen_range(0..p.champion_map.len());
    for (_, c) in p.champion_map.iter() {
        if i > 0 {
            i -= 1;
            continue;
        }

        let key: i64 = c.key.parse().unwrap();
        crate::window::show_and_emit(&handle, key, &c.id);
        break;
    }
}

#[command]
pub fn apply_builds_from_sources(app_handle: AppHandle, sources: Vec<String>, keep_old: bool) {
    let w = app_handle.get_window("main").unwrap();
    let cmd::CommandLineOutput { dir, .. } = cmd::get_commandline();
    builds::spawn_apply_task(&sources, &dir, keep_old, &w);
}

#[command]
pub fn get_lcu_auth(state: State<'_, state::GlobalState>) -> String {
    let output = cmd::get_commandline();
    let s = state.0.lock().unwrap();
    println!("[command] {:?}", s);
    output.auth_url
}

#[command]
pub fn get_available_perks_for_champion(
    source_name: String,
    champion_alias: String,
) -> Vec<builds::Rune> {
    let (tx, rx) = mpsc::channel();
    async_runtime::spawn(async move {
        let r = match builds::load_runes(&source_name, &champion_alias).await {
            Ok(runes) => runes,
            Err(e) => {
                println!("[commands::get_runes] {:?}", e);
                vec![]
            }
        };
        let _ = tx.send(r);
    });

    rx.recv().unwrap()
}

#[command]
pub fn apply_builds(app_handle: AppHandle, sources: Vec<String>) {
    let w = app_handle.get_window("main").unwrap();
    let cmd::CommandLineOutput {
        dir, is_tencent, ..
    } = cmd::get_commandline();

    async_runtime::spawn(async move {
        builds::empty_lol_build_dir(&dir, is_tencent, &Some(w));

        let mut idx = 0;
        for s in sources {
            println!("[commands::apply_builds] {idx} {s}");
            let _ =
                builds::apply_builds_from_local(&s, &dir, is_tencent, idx, Some(&app_handle)).await;
            idx += 1;
        }
    });
}

#[command]
pub async fn get_ddragon_data(
    state: State<'_, state::GlobalState>,
) -> Result<page_data::PageData, ()> {
    let s = state.0.lock().unwrap();
    let p = s.page_data.lock().unwrap();

    Ok(p.clone())
}

#[command]
pub fn get_user_sources(state: State<'_, state::GlobalState>) -> Vec<page_data::Source> {
    let s = state.0.lock().unwrap();
    let p = s.page_data.lock().unwrap();

    p.source_list.clone()
}

#[command]
pub fn get_runes_reforged(state: State<'_, state::GlobalState>) -> Vec<web::RuneListItem> {
    let s = state.0.lock().unwrap();
    let p = s.page_data.lock().unwrap();

    p.rune_list.clone()
}

#[command]
pub async fn apply_perk(perk: String) -> Result<(), ()> {
    let _h = async_runtime::spawn(async move {
        let output = cmd::get_commandline();
        let _ = cmd::spawn_apply_rune(&output.token, &output.port, &perk).await;
    });

    Ok(())
}

#[command]
pub fn update_app_auto_start(state: State<'_, state::GlobalState>, auto_start: bool) {
    let s = state.0.lock().unwrap();
    let mut s = s.settings.lock().unwrap();

    s.on_auto_start(Some(auto_start));
}

#[command]
pub fn init_server_data(state: State<'_, state::GlobalState>, handle: AppHandle) {
    let main_win = &handle.get_window("main").unwrap();

    let state = state.0.lock().unwrap();
    let page_data = state.page_data.lock().unwrap();
    if page_data.ready {
        println!("[command::init_server_data] already fetched");
        let r = (
            page_data.ready,
            page_data.source_list.clone(),
            page_data.rune_list.clone(),
            page_data.official_version.clone(),
            page_data.champion_map.clone(),
        );
        let _ = main_win.emit("webview::server_data", r);
        return ();
    }

    async_runtime::spawn(async move {
        match page_data::PageData::init().await {
            Ok(r) => {
                let main_win = &handle.get_window("main").unwrap();
                let _ = main_win.emit("webview::server_data", r);
            }
            Err(e) => {
                println!("{:?}", e);
            }
        };
    });
}

#[command]
pub fn set_page_data(
    state: State<'_, state::GlobalState>,
    data: (
        bool,
        Vec<page_data::Source>,
        Vec<web::RuneListItem>,
        String,
        HashMap<String, web::ChampInfo>,
    ),
) {
    
    let st = state.0.lock().unwrap();
    let mut page_data = st.page_data.lock().unwrap();
    
    if page_data.ready {
        println!("[commands::set_page_data] already done");
        return ();
    }
    
    let (ready, source_list, rune_list, version, champion_map) = data;
    page_data.ready = ready;
    page_data.source_list = source_list;
    page_data.rune_list = rune_list;
    page_data.official_version = version;
    page_data.champion_map = champion_map;
    println!("[commands::set_page_data] done");
}

#[command]
pub fn watch_lcu(state: State<'_, state::GlobalState>, handle: AppHandle) {
    let st = state.0.lock().unwrap();
    let page_data = st.page_data.lock().unwrap();
    let champion_map = page_data.champion_map.clone();
    let main_win = handle.get_window("main").unwrap();

    async_std::task::spawn(async move {
        let mut auth_token = String::new();

        loop {
            let cmd::CommandLineOutput { token, port, .. } = cmd::get_commandline();
            let running = !token.is_empty() && !port.is_empty();
            println!("webview::lol_running_status: {running}");
            let _ = main_win.emit("webview::lol_running_status", vec![running]);

            if !auth_token.eq(token.as_str()) {
                auth_token = token.clone();
                if !auth_token.is_empty() && !port.is_empty() {
                    let _ = cmd::spawn_league_client(&token, &port, &champion_map, Some(&main_win))
                        .await;
                } else {
                    println!("[spawn] auth: invalid token & port");
                }
            }
            thread::sleep(time::Duration::from_secs(6));
        }
    });
}
