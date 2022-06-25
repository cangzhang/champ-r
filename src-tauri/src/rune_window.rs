use tauri::{AppHandle, Manager, WindowBuilder, WindowUrl};

pub fn toggle(app_handle: &AppHandle) {
    let w = app_handle.get_window("rune");
    if let Some(w) = w {
        println!("rune existed");
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
    )
    .title("Rune")
    .build()
    .unwrap();
    
    println!("rune created");
}