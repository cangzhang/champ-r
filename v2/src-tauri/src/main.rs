#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

use tauri::{CustomMenuItem, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem};

pub mod commands;
pub mod rune_window;

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("toggle_window", "Toggle"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit", "Quit").accelerator("CmdOrControl+Q"));

    let context = tauri::generate_context!();
    let _app = tauri::Builder::default()
        .setup(|_app| {
            Ok(())
        })
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(move |app_handle, event| {
            match event {
                SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                    "toggle_window" => {
                        let _ = rune_window::toggle_rune_window(app_handle);
                    }
                    _ => {
                        println!("{}", id.as_str());
                    }
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![commands::greeting])
        .run(context)
        .expect("error while running tauri application");
}
