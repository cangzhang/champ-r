use tauri::Window;

use crate::Payload;

#[tauri::command]
pub fn greeting(name: &str) -> String {
    format!("Hello {}", name)
}

#[tauri::command]
pub fn emit_msg(window: Window) {
    println!("window label: {}", window.label());
    window.open_devtools();
    window
        .emit(
            "event-name",
            Payload {
                message: "emit message".into(),
            },
        )
        .unwrap();
}
