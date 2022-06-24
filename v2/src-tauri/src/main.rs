#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use tauri::{
    CustomMenuItem, Manager, SystemTray, SystemTrayEvent, SystemTrayMenu, SystemTrayMenuItem,
};

pub mod commands;
pub mod rune_window;

#[derive(Clone, serde::Serialize)]
pub struct Payload {
    pub message: String,
}

fn main() {
    let tray_menu = SystemTrayMenu::new()
        .add_item(CustomMenuItem::new("toggle_window", "Toggle"))
        .add_native_item(SystemTrayMenuItem::Separator)
        .add_item(CustomMenuItem::new("quit", "Quit").accelerator("CmdOrControl+Q"));

    let context = tauri::generate_context!();
    let _app = tauri::Builder::default()
        .setup(|app| {
            let _handle = app.handle();

            let main_window = app.get_window("main").unwrap();
            let _id = main_window.listen("event-name", |event| {
                println!("got window event-name with payload {:?}", event.payload());
            });

            // emit the `event-name` event to the `main` window
            main_window
                .emit(
                    "event-name",
                    Payload {
                        message: "Tauri is awesome!".into(),
                    },
                )
                .unwrap();

            Ok(())
        })
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(move |app_handle, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "toggle_window" => {
                    let _ = rune_window::toggle_rune_window(app_handle);
                }
                _ => {
                    println!("{}", id.as_str());
                }
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            commands::greeting,
            commands::emit_msg
        ])
        .run(context)
        .expect("error while running tauri application");
}
