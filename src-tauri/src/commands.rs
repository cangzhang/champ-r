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
pub fn apply_builds_from_sources(sources: Vec<String>, keep_old: bool) {
    async_std::task::spawn(async move {
        println!(
            "[browser commands] get ready to apply builds. sources: {:?}, keepOld: {:?}",
            &sources, keep_old
        );
        let _ = crate::builds::apply_builds(sources, "../.cdn_files".to_string(), keep_old).await;
    });
}
