#![cfg_attr(
all(not(debug_assertions), target_os = "windows"),
windows_subsystem = "windows"
)]

use tauri::{CustomMenuItem, Menu, MenuItem, Submenu};

pub mod commands;

fn main() {
    let quit = CustomMenuItem::new("quit".to_string(), "Quit");
    let toggle_rune = CustomMenuItem::new("toggleRuneWindow", "Toggle");
    let menu = Menu::new()
        .add_submenu(Submenu::new("Quit", Menu::new().add_item(quit)))
        .add_submenu(Submenu::new("Control", Menu::new().add_item(toggle_rune)));

    let context = tauri::generate_context!();
    let app = tauri::Builder::default()
        .menu(menu)
        .on_menu_event(|ev| {
            match ev.menu_item_id() {
                "toggleRuneWindow" => {
                    format!("toggle rune window");
                }
                _ => {}
            }
        })
        .invoke_handler(tauri::generate_handler![commands::greeting])
        .run(context)
        .expect("error while running tauri application");
}
