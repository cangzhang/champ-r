use tauri::{AppHandle, Manager, WindowBuilder, WindowUrl};

#[derive(Clone, serde::Serialize)]
pub struct ChampionSelectPayload {
    pub champion_id: i64,
}

pub fn toggle(app_handle: &AppHandle, status: Option<bool>) {
    let handle = app_handle.clone();
    std::thread::spawn(move || {
        let w = handle.get_window("rune");
        if let Some(w) = w {
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

            return ();
        }

        let _w = WindowBuilder::new(&handle, "rune", WindowUrl::App("rune.html".into()))
            .title("Rune")
            .position(400., 400.)
            .inner_size(400., 540.)
            .skip_taskbar(true)
            .build()
            .unwrap();
    });
}

pub fn show_and_emit(app_handle: &AppHandle, champion_id: i64) {
    let handle = app_handle.clone();
    std::thread::spawn(move || {
        let w = handle.get_window("rune");
        let w = if let Some(w) = w {
            let _ = w.show();
            w
        } else {
            let w = WindowBuilder::new(&handle, "rune", WindowUrl::App("rune.html".into()))
                .title("Rune")
                .position(400., 400.)
                .inner_size(400., 540.)
                .skip_taskbar(true)
                .build()
                .unwrap();
            w
        };
        let _ = w.emit(
            "rune::selected_champion",
            ChampionSelectPayload { champion_id },
        );
    });
}
