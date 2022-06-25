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
            let main_window = app.get_window("main").unwrap();
            let handle = app.handle();

            std::thread::spawn(move || {
                let _ = tauri::WindowBuilder::new(
                    &handle,
                    "rune",
                    tauri::WindowUrl::App("rune.html".into()),
                )
                .visible(false)
                .build();
            });

            let _id = main_window.listen("toggle_rune-global", move |event| {
                println!("global listener, payload {:?}", event.payload().unwrap());
                // let w = app.get_window("main").unwrap();
                // if w.is_visible().unwrap() {
                //     w.hide();
                // } else {
                //     w.show();
                // }
            });

            Ok(())
        })
        .system_tray(SystemTray::new().with_menu(tray_menu))
        .on_system_tray_event(move |app_handle, event| match event {
            SystemTrayEvent::MenuItemClick { id, .. } => match id.as_str() {
                "toggle_window" => {
                    let _ = rune_window::toggle(app_handle);
                }
                _ => {
                    println!("{}", id.as_str());
                }
            },
            _ => {}
        })
        .invoke_handler(tauri::generate_handler![
            commands::greeting,
            commands::emit_msg,
        ])
        .run(context)
        .expect("error while running tauri application");
}
