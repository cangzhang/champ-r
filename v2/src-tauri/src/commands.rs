use tauri::Manager;

#[tauri::command]
pub fn greeting(name: &str) -> String {
    format!("Hello {}", name)
}

#[tauri::command]
pub fn toggle_rune_window(window: tauri::Window) {
    window.trigger("toggle_rune-global", Some("".to_string()));
}

#[tauri::command]
pub fn apply_builds_from_sources(
    app_handle: tauri::AppHandle,
    sources: Vec<String>,
    dir: String,
    keep_old: bool,
) {
    let w = app_handle.get_window("main").unwrap();
    println!("{}", w.label());
    crate::builds::spawn_apply_task(sources, dir, keep_old, &w);
}
