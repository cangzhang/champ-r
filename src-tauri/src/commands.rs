use tauri::Manager;

#[tauri::command]
pub fn greeting(name: &str) -> String {
    format!("Hello {}", name)
}

#[tauri::command]
pub fn toggle_rune_window(window: tauri::Window) {
    window.trigger("global::toggle_rune", Some("".to_string()));
}

#[tauri::command]
pub fn apply_builds_from_sources(
    app_handle: tauri::AppHandle,
    sources: Vec<String>,
    dir: String,
    keep_old: bool,
) {
    let w = app_handle.get_window("main").unwrap();
    crate::builds::spawn_apply_task(sources, dir, keep_old, &w);
}

#[tauri::command]
pub fn get_lcu_auth(state: tauri::State<'_, crate::state::GlobalState>) -> String {
    let (auth_url, _done) = crate::cmd::get_commandline();
    let s = state.0.lock().unwrap();
    println!("[command] {:?}", s);
    auth_url
}
