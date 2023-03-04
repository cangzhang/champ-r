#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::env;

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
pub mod settings;
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
    // let settings = StoreBuilder::new(".settings".parse().unwrap()).build();

    tauri::Builder::default()
        .plugin(PluginBuilder::default().build())
        .plugin(tauri_plugin_single_instance::init(|_app, _argv, _cwd| {}))
        .setup(move |app| {
            let mut inner_state = state::InnerState::new();
            inner_state.init_settings();

            let st = state::GlobalState::init(inner_state);
            app.manage(st);

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
                    window::toggle_main_window(app_handle);
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
            commands::update_app_auto_start,
            commands::init_server_data,
            commands::set_page_data,
            commands::watch_lcu,
            ])
        .run(context)
        .expect("error while running tauri application");
}
