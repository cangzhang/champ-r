#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{sync::mpsc, thread, time};

use serde_json::Value;
use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};
use tauri_plugin_store::PluginBuilder;

pub mod builds;
pub mod cmd;
pub mod commands;
pub mod lcu;
pub mod page_data;
pub mod state;
pub mod web;
pub mod window;

#[derive(Clone, serde::Serialize)]
pub struct GlobalEventPayload {
    pub action: String,
    pub data: Option<Value>,
}

fn main() {
    let (tx, rx) = mpsc::channel();
    async_std::task::spawn(async move {
        match page_data::PageData::init().await {
            Ok(r) => {
                let _ = tx.send(r);
            }
            Err(e) => {
                println!("{:?}", e);
            }
        };
    });

    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("toggle_window", "Toggle"))
        .add_item(CustomMenuItem::new("apply_builds", "Apply Builds"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit", "Quit").accelerator("CmdOrControl+Q"));

    let context = tauri::generate_context!();
    // let settings = StoreBuilder::new(".settings".parse().unwrap()).build();

    let _app = tauri::Builder::default()
        .plugin(PluginBuilder::default().build())
        .setup(move |app| {
            let mut inner_state = state::InnerState::new();
            // inner_state.init(&app.handle());
            let (ready, source_list, rune_list, version, champion_map) = rx.recv().unwrap();
            inner_state.init_page_data(ready, &source_list, &rune_list, &version, &champion_map);
            let st = state::GlobalState::init(inner_state);
            app.manage(st);

            let main_win = app.get_window("main").unwrap();
            let champion_map = champion_map.clone();
            async_std::task::spawn(async move {
                let mut auth_token = String::new();
                loop {
                    let cmd::CommandLineOutput { token, port, .. } = cmd::get_commandline();
                    if !auth_token.eq(token.as_str()) {
                        auth_token = token.clone();
                        if auth_token.len() > 0 && port.len() > 0 {
                            let _ = cmd::spawn_league_client(
                                &token,
                                &port,
                                &champion_map,
                                Some(&main_win),
                            )
                            .await;
                        } else {
                            println!("[spawn] auth: invalid token & port");
                        }
                    }
                    thread::sleep(time::Duration::from_millis(10000));
                }
            });

            let handle = app.handle();
            let _ = app.listen_global("global_events", move |ev| {
                let s = ev.payload().unwrap();
                // println!("global listener payload {:?}", s);
                let payload: Value = serde_json::from_str(s).unwrap();
                let action = match payload.get("action") {
                    Some(action) => action.as_str(),
                    None => Some(""),
                };
                match action {
                    Some("toggle_rune_window") => {
                        window::toggle_rune_win(&handle, None);
                    }
                    Some("on_champ_select") => {
                        let champ_id = payload["id"].as_i64().unwrap();
                        let champ_alias = payload["alias"].as_str().unwrap();
                        window::show_and_emit(&handle, champ_id, &champ_alias.to_string());
                    }
                    Some("hide_rune_win") => {
                        window::toggle_rune_win(&handle, Some(false));
                    }
                    Some(_) => {}
                    None => {}
                };
            });

            window::setup_window_shadow(app);

            Ok(())
        })
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(move |app_handle, event| match event {
            SystemTrayEvent::LeftClick { .. } => {
                window::toggle_main_window(app_handle);
            }
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "toggle_window" => {
                    let _ = window::toggle_main_window(app_handle);
                }
                "apply_builds" => {}
                "quit" => {
                    std::process::exit(0);
                }
                _ => {
                    println!("{}", id.as_str());
                }
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            commands::toggle_rune_window,
            // commands::apply_builds_from_sources,
            commands::get_lcu_auth,
            commands::get_available_perks_for_champion,
            commands::apply_builds,
            commands::get_ddragon_data,
            commands::get_user_sources,
            commands::get_runes_reforged,
            commands::random_runes,
            commands::apply_perk,
        ])
        .run(context)
        .expect("error while running tauri application");
}
