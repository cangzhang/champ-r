#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use gui::wind::run_app;

// #[tokio::main]
fn main() {
    femme::with_level(femme::LevelFilter::Info);

    let _ = run_app();
}
