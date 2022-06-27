use tauri::{AppHandle, Manager, WindowBuilder, WindowUrl};

pub fn toggle(app_handle: &AppHandle) {
    let w = app_handle.get_window("rune");
    if let Some(w) = w {
        let v = w.is_visible().unwrap();
        if v {
            w.hide().unwrap();
        } else {
            w.show().unwrap();
        }

        return ();
    }

    let _w = WindowBuilder::new(app_handle, "rune", WindowUrl::App("rune.html".into()))
        .title("Rune")
        .position(400., 400.)
        .inner_size(400., 540.)
        .skip_taskbar(true)
        .build()
        .unwrap();
}
