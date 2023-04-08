use std::{sync::mpsc, vec};

use rand::Rng;
use serde::{Serialize, Deserialize};
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

// #[command]
// pub fn init_state(state: State<'_, state::GlobalState>, handle: AppHandle) {
//     let mut state = state.0.lock().unwrap();
//     // let s = *state;
//     thread::spawn(move || {
//         state.init(&handle);
//     });
// }

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
struct ApplyFixResult {
    pub applied: bool,
    pub ready: bool,
}

#[command]
pub async fn check_and_fix_tencent_server(app_handle: AppHandle) {
    let main_win = app_handle.get_window("main").unwrap();

    async_runtime::spawn(async move {
        if let Ok(ready) = cmd::check_if_server_ready().await {
            if !ready {
                let r = cmd::fix_tencent_server().await;
                
                if let Ok(r) = r {
                    let _ = &main_win.emit("main::applied_fix_to_tencent_server", ApplyFixResult {
                        applied: true,
                        ready: r,
                    });
                } else {
                    let _ = &main_win.emit("main::applied_fix_to_tencent_server", ApplyFixResult {
                        applied: false,
                        ready,
                    });
                    println!("[commands::applied_fix_to_tencent_server] failed");
                }
            } else {
                let _ = &main_win.emit("main::applied_fix_to_tencent_server", ApplyFixResult {
                    applied: false,
                    ready: true,
                });
                println!("[commands::applied_fix_to_tencent_server] already");
            }
        } else {
            println!("[commands::check_and_fix_tencent_server] check_if_server_ready: failed");
        }
    });
}

#[command]
pub async fn test_connectivity(app_handle: AppHandle) {
    let main_win = app_handle.get_window("main").unwrap();

    async_runtime::spawn(async move {
        if let Ok(connected) = cmd::test_connectivity().await {
            let _ = &main_win.emit("main::test_connectivity", connected);
        } else {
            println!("[commands::test_connectivity] test failed");
        }
    });
}

#[command]
pub async fn check_if_lol_running(app_handle: AppHandle) {
    let main_win = app_handle.get_window("main").unwrap();

    async_runtime::spawn(async move {
        let running = cmd::check_if_lol_running();
        let _ = &main_win.emit("webview::lol_running_status", (running, ()));
    });
}
