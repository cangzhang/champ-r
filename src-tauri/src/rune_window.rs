use tauri::{AppHandle, Manager, WindowBuilder, WindowUrl, Window};

use crate::builds;

#[derive(Clone, serde::Serialize, Default)]
pub struct ChampionSelectPayload {
    pub champion_id: i64,
}

#[derive(Clone, serde::Serialize, Default)]
pub struct SourceRunesPayload {
    pub runes: Option<Vec<builds::Rune>>,
}

pub fn toggle(app_handle: &AppHandle, status: Option<bool>) {
    let w = get_rune_window(app_handle);
    let v = match status {
        Some(v) => v,
        None => {
            let v = w.is_visible().unwrap();
            !v
        }
    };
    if v {
        let _ = w.show();
    } else {
        let _ = w.hide();
    }
}

pub fn show_and_emit(app_handle: &AppHandle, champion_id: i64) {
    let w = get_rune_window(app_handle);
    let _ = w.emit(
        "popup_window::selected_champion",
        ChampionSelectPayload { champion_id },
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
                .title("Rune")
                .position(400., 400.)
                .inner_size(400., 540.)
                .skip_taskbar(true)
                .build()
                .unwrap();
            let _ = w.hide();
            w
        };
        let _ = tx.send(w);
    });

    rx.recv().unwrap()
}
