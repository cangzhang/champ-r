#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use serde_json::Value;
use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

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
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("toggle_window", "Toggle"))
        .add_item(CustomMenuItem::new("apply_builds", "Apply Builds"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit", "Quit").accelerator("CmdOrControl+Q"));

    let context = tauri::generate_context!();

    let _app = tauri::Builder::default()
        .setup(move |app| {
            let mut inner_state = state::InnerState::new();
            inner_state.init(&app.handle());
            let state = state::GlobalState::init(inner_state);
            app.manage(state);

            let handle = app.handle();
            let _ = app.listen_global("global_events", move |ev| {
                let s = ev.payload().unwrap();
                println!("global listener payload {:?}", s);
                let payload: Value = serde_json::from_str(s).unwrap();
                let action = match payload.get("action") {
                    Some(action) => action.as_str(),
                    None => Some(""),
                };
                match action {
                    Some("toggle_rune_window") => {
                        window::toggle_rune_win(&handle, None);
                    }
                    Some("get_runes") => {
                        /*
                        match payload["data"].as_object() {
                            Some(obj) => {
                                let champion_alias = obj["champion_alias"].as_i64().unwrap();
                                let source_name = obj["source_name"].as_str().unwrap();
                                println!("{champion_alias} {source_name}");

                                let source = source_name.to_string();
                                let alias = champion_alias.to_string();
                                let handle = handle.clone();

                                async_std::task::spawn(async move {
                                    match builds::load_runes(
                                        &source,
                                        &alias,
                                    )
                                    .await {
                                        Ok(runes) => {
                                            println!("[global_events] got runes for {alias}@{source},{:?}", runes.len());
                                            rune_window::emit_runes(&handle, runes);
                                        }
                                        Err(e) => {
                                            println!("[global_events] failed to load runes for {alias}@{source}, {:?}", e);
                                        }
                                    };
                                });
                            }
                            None => {}
                        };
                        */
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
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "toggle_window" => {
                    let _ = window::toggle_rune_win(app_handle, None);
                }
                "apply_builds" => {
                    println!("[tray] apply builds");
                    let w = app_handle.get_window("main").unwrap();
                    builds::spawn_apply_task(
                        vec!["op.gg-aram".to_string()],
                        "../.cdn_files".to_string(),
                        false,
                        &w,
                    )
                }
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
            commands::apply_builds_from_sources,
            commands::get_lcu_auth,
            commands::get_available_runes_for_champion,
            commands::apply_builds,
            commands::get_ddragon_data,
            commands::get_user_sources,
            commands::get_runes_reforged,
        ])
        .run(context)
        .expect("error while running tauri application");
}
