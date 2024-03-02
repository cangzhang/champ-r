use std::sync::{Arc, Mutex, RwLock};

use crate::source_ui::setup_custom_fonts;
use eframe::egui;
use eframe::egui::IconData;
use lcu::{cmd::CommandLineOutput, task};

pub mod config;
pub mod rune_ui;
pub mod toggle_ui;
pub mod source_ui;
pub mod wind;

pub fn load_icon_data(image_data: &[u8]) -> IconData {
    let image = image::load_from_memory(image_data).unwrap();
    let image_buffer = image.to_rgba8();
    let pixels = image_buffer.as_raw().clone();

    IconData {
        rgba: pixels,
        width: image.width(),
        height: image.height(),
    }
}

pub async fn run_source_ui() -> Result<(), eframe::Error> {
    let lcu_auth = Arc::new(RwLock::new(CommandLineOutput::default()));
    let lcu_auth_ui = lcu_auth.clone();
    let lcu_auth_task = lcu_auth.clone();

    let ui_cc: Arc<Mutex<Option<egui::Context>>> = Arc::new(Mutex::new(None));
    let ui_cc_clone = ui_cc.clone();
    let champion_id = Arc::new(RwLock::new(None));
    let champion_id_ui = champion_id.clone();

    let random_mode = Arc::new(Mutex::new(false));
    let random_mode_ui = random_mode.clone();

    let watch_task_handle = tokio::spawn(async move {
        task::watch_auth_and_champion(ui_cc, lcu_auth_task, champion_id, random_mode).await;
    });
    let lcu_task_handle = Some(watch_task_handle.abort_handle());

    let app_icon = load_icon_data(include_bytes!("../../../assets/icon@2x_r.png"));
    let main_win_opts = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([300., 480.])
            .with_icon(app_icon),
        persist_window: true,
        ..Default::default()
    };
    eframe::run_native(
        "ChampR",
        main_win_opts,
        Box::new(move |cc| {
            // This gives us image support:
            egui_extras::install_image_loaders(&cc.egui_ctx);
            setup_custom_fonts(&cc.egui_ctx);

            let app_data = source_ui::SourceUI::new(
                lcu_auth_ui.clone(),
                lcu_task_handle,
                ui_cc_clone,
                champion_id_ui,
                random_mode_ui,
            );
            Box::new(app_data)
        }),
    )?;

    Ok(())
}

pub async fn run_rune_ui() -> Result<(), eframe::Error> {
    let lcu_auth = Arc::new(RwLock::new(CommandLineOutput::default()));
    let lcu_auth_ui = lcu_auth.clone();
    let lcu_auth_task = lcu_auth.clone();

    let ui_cc: Arc<Mutex<Option<egui::Context>>> = Arc::new(Mutex::new(None));
    // let ui_cc_clone = ui_cc.clone();
    let champion_id = Arc::new(RwLock::new(None));
    let champion_id_ui = champion_id.clone();

    let random_mode = Arc::new(Mutex::new(false));
    // let random_mode_ui = random_mode.clone();

    let watch_task_handle = tokio::spawn(async move {
        task::watch_auth_and_champion(ui_cc, lcu_auth_task, champion_id, random_mode).await;
    });
    let lcu_task_handle = Some(watch_task_handle.abort_handle());

    let app_icon = load_icon_data(include_bytes!("../../../assets/icon@2x_r.png"));
    let main_win_opts = eframe::NativeOptions {
        viewport: egui::ViewportBuilder::default()
            .with_inner_size([300., 480.])
            .with_icon(app_icon),
        persist_window: true,
        ..Default::default()
    };
    eframe::run_native(
        "Runes",
        main_win_opts,
        Box::new(move |cc| {
            // This gives us image support:
            egui_extras::install_image_loaders(&cc.egui_ctx);
            setup_custom_fonts(&cc.egui_ctx);

            let app_data = rune_ui::RuneUI::new(
                lcu_auth_ui.clone(),
                lcu_task_handle,
                champion_id_ui,
            );
            Box::new(app_data)
        }),
    )?;

    Ok(())
}
