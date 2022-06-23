use tauri::{AppHandle, Manager, WindowBuilder, WindowUrl};

pub fn toggle_rune_window(app_handle: &AppHandle) {
    let w = app_handle.get_window("rune");
    if let Some(w) = w {
        let v = w.is_visible().unwrap();
        if v {
            let _ = w.hide();
        } else {
            let _ = w.show();
        }
        return ();
    }

    let w = WindowBuilder::new(
        app_handle,
        "rune",
        WindowUrl::App("rune.html".into()),
    ).build().unwrap();
    let _ = w.set_title("Rune Case");
}