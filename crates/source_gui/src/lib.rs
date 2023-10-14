use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use cmd::CommandLineOutput;
use eframe::egui;

pub mod builds;
pub mod cmd;
pub mod config;
pub mod constants;
pub mod lcu;
pub mod source;
pub mod ui;
pub mod web;

pub async fn run() -> Result<(), eframe::Error> {
    // Log to stderr (if you run with `RUST_LOG=debug`).
    env_logger::init();

    let lcu_auth = Arc::new(Mutex::new(CommandLineOutput::default()));
    let lcu_auth_ui = lcu_auth.clone();

    let lcu_task_join_handle = tokio::spawn(async move {
        loop {
            let auth = cmd::get_commandline();
            *lcu_auth.lock().unwrap() = auth;
            tokio::time::sleep(Duration::from_millis(2500)).await;
        }
    });
    let lcu_task_handle = Some(lcu_task_join_handle.abort_handle());

    let main_win_opts = eframe::NativeOptions {
        initial_window_size: Some(egui::vec2(500.0, 400.0)),
        ..Default::default()
    };
    eframe::run_native(
        "ChampR",
        main_win_opts,
        Box::new(move |cc| {
            // This gives us image support:
            egui_extras::install_image_loaders(&cc.egui_ctx);

            let app_data = ui::MyApp::new(lcu_auth_ui, lcu_task_handle);
            Box::new(app_data)
        }),
    )?;

    Ok(())
}
