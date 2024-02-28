#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

#[tokio::main]
async fn main() -> Result<(), eframe::Error> {
    femme::with_level(femme::LevelFilter::Info);

    tokio::spawn(async {
        let _ = gui::run_source_ui().await;
    });
    tokio::spawn(async {
        let _ = gui::run_rune_ui().await;
    });

    Ok(())
}
