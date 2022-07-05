#[tauri::command]
pub fn greeting(name: &str) -> String {
    format!("Hello {}", name)
}

#[tauri::command]
pub fn toggle_rune_window(window: tauri::Window) {
    window.trigger("toggle_rune-global", Some("".to_string()));
}

#[tauri::command]
pub fn apply_builds_from_sources(sources: Vec<String>, dir: String, keep_old: bool) {
    crate::builds::spawn_apply_task(sources, dir, keep_old);
}
