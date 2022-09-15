use tauri::{AppHandle, Manager, WindowBuilder, WindowUrl};

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
