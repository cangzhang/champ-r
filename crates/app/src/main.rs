#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[tokio::main]
async fn main() {
    std::process::Command::new("./target/debug/source_gui.exe")
        .spawn()
        .expect("failed to start source_gui.exe");

    std::process::Command::new("./target/debug/rune_gui.exe")
        .spawn()
        .expect("failed to start rune_gui.exe");

    loop {}
}
