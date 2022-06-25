use tauri::Window;

#[tauri::command]
pub fn greeting(name: &str) -> String {
    format!("Hello {}", name)
}

#[tauri::command]
pub fn emit_msg(window: Window) {
    window.trigger("toggle_rune-global", Some("".to_string()));
}
