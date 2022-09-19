use serde_json::json;
use tauri::{AppHandle, Manager};

use crate::builds;

#[tauri::command]
pub fn toggle_rune_window(window: tauri::Window) {
    let payload = json!({
        "action": "toggle_rune_window",
    });
    window.trigger("global_events", Some(payload.to_string()));
}

#[tauri::command]
pub fn apply_builds_from_sources(
    app_handle: AppHandle,
    sources: Vec<String>,
    dir: String,
    keep_old: bool,
) {
    let w = app_handle.get_window("main").unwrap();
    builds::spawn_apply_task(sources, dir, keep_old, &w);
}

#[tauri::command]
pub fn get_lcu_auth(state: tauri::State<'_, crate::state::GlobalState>) -> String {
    let (auth_url, _done) = crate::cmd::get_commandline();
    let s = state.0.lock().unwrap();
    println!("[command] {:?}", s);
    auth_url
}

#[tauri::command]
pub fn get_runes(source_name: String, champion_alias: String) -> Vec<builds::Rune> {
    tauri::async_runtime::block_on(async move {
        match builds::load_runes(&source_name, &champion_alias).await {
            Ok(runes) => runes,
            Err(e) => {
                println!("[commands::get_runes] {:?}", e);
                vec![]
            }
        }
    })
}

#[tauri::command]
pub fn apply_builds(app_handle: AppHandle, sources: Vec<String>) {
    tauri::async_runtime::spawn(async move {
        let mut idx = 0;
        for s in sources {
            println!("[commands::apply_builds] {idx} {s}");
            let _ = builds::apply_builds_from_local(&s, &".cdn_files".to_string(), idx, Some(&app_handle)).await;
            idx = idx + 1;
        }
    });
}
