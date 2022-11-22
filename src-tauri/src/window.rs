use tauri::{App, AppHandle, Manager, Window, WindowBuilder, WindowUrl};
use window_shadows::set_shadow;

use crate::builds::{self, make_id};

#[derive(Clone, serde::Serialize, Default)]
pub struct ChampionSelectPayload {
    pub champion_id: i64,
    pub champion_alias: String,
}

#[derive(Clone, serde::Serialize, Default)]
pub struct SourceRunesPayload {
    pub runes: Option<Vec<builds::Rune>>,
}

pub fn toggle_rune_win(app_handle: &AppHandle, status: Option<bool>) {
    let w = get_rune_window(app_handle);
    let v = match status {
        Some(v) => v,
        None => {
            let v = w.is_visible().unwrap_or_default();
            !v
        }
    };
    if v {
        let _ = w.show();
    } else {
        let _ = w.hide();
    }
}

pub fn toggle_main_window(handle: &AppHandle) {
    let w = handle.get_window("main").unwrap();
    if let Ok(v) = w.is_visible() {
        if v {
            let _ = w.hide();
        } else {
            let _ = w.show();
            let _ = w.set_focus();
        }
    }
}

pub fn show_and_emit(app_handle: &AppHandle, champion_id: i64, champion_alias: &String) {
    let w = get_rune_window(app_handle);
    // let _ = w.show();
    // let _ = w.set_always_on_top(true);
    let _ = w.emit(
        "popup_window::selected_champion",
        ChampionSelectPayload {
            champion_id,
            champion_alias: champion_alias.to_string(),
        },
    );
}

pub fn emit_runes(app_handle: &AppHandle, runes: Vec<builds::Rune>) {
    let w = get_rune_window(app_handle);
    let _ = w.emit(
        "popup_window::rune_list",
        SourceRunesPayload { runes: Some(runes) },
    );
}

pub fn get_rune_window(handle: &AppHandle) -> Window {
    let (tx, rx) = std::sync::mpsc::channel();
    let handle = handle.clone();

    std::thread::spawn(move || {
        let w = handle.get_window("rune");
        let w = if let Some(w) = w {
            w
        } else {
            let w = WindowBuilder::new(&handle, "rune", WindowUrl::App("rune.html".into()))
                .visible(false)
                .title("Rune")
                .position(400., 400.)
                .inner_size(400., 540.)
                .skip_taskbar(true)
                .build()
                .unwrap();
            w
        };
        let _ = tx.send(w);
    });

    rx.recv().unwrap()
}

pub fn get_main_window(handle: &AppHandle) -> Window {
    handle.get_window("main").unwrap()
}

#[derive(Clone, serde::Serialize, Default)]
pub struct ApplyBuildsMessagePayload {
    pub source: String,
    pub msg: String,
    pub done: bool,
    pub in_progress: bool,
    pub id: String,
}

pub fn emit_apply_builds_msg(
    handle: &AppHandle,
    source: &String,
    msg: &String,
    done: bool,
    in_progress: bool,
) {
    let w = get_main_window(handle);
    let _ = w.emit(
        "main_window::apply_builds_result",
        ApplyBuildsMessagePayload {
            source: source.to_string(),
            msg: msg.to_string(),
            done,
            in_progress,
            id: make_id(),
        },
    );
}

pub fn setup_window_shadow(app: &App) {
    let main_win = app.get_window("main").unwrap();
    let _ = set_shadow(&main_win, true);
    let rune_win = app.get_window("rune").unwrap();
    let _ = set_shadow(&rune_win, true);
}
