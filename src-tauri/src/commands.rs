use serde_json::json;
use tauri::Manager;

// use crate::builds;

#[tauri::command]
pub fn toggle_rune_window(window: tauri::Window) {
    let payload = json!({
        "action": "toggle_rune_window",
    });
    window.trigger("global_events", Some(payload.to_string()));
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

#[tauri::command]
pub fn get_runes(window: tauri::Window, champion_id: i64, source_name: String) {
    let payload = json!({
        "action": "get_runes",
        "data": [champion_id, source_name],
    });
    window.trigger("global_events", Some(payload.to_string()));
}
