use tauri::Window;

#[tauri::command]
pub fn greeting(name: &str) -> String {
    format!("Hello {}", name)
}

#[tauri::command]
pub fn toggle_rune_window(window: Window) {
    window.trigger("toggle_rune-global", Some("".to_string()));
}

#[tauri::command]
pub fn apply_builds_from_sources(sources: Vec<&str>, keep_old: bool) {
    println!("get ready to apply builds...");
    let sources = sources.iter().map(|i| i.to_string()).collect();
    let _ = crate::builds::apply_builds(sources, "../.cdn_files".to_string(), keep_old);
}
