#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use gui::run_champr;

#[tokio::main]
async fn main() -> Result<(), ()> {
    femme::with_level(femme::LevelFilter::Info);

    run_champr();

    Ok(())
}
