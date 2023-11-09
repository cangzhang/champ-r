use eframe::egui;
use std::{
    sync::{Arc, Mutex},
    time::Duration,
};

use lcu::{
    asset_loader::AssetLoader,
    cmd::{self, CommandLineOutput}, api,
};

pub mod ui;

async fn watch(
    ui_ctx: Arc<Mutex<Option<egui::Context>>>,
    lcu_auth: Arc<Mutex<CommandLineOutput>>,
    champion_id: Arc<Mutex<Option<i64>>>,
    champion_changed: Arc<Mutex<bool>>,
) {
    loop {
        println!(".");
        let mut repaint = false;

        {
            let cmd_output = cmd::get_commandline();
            let mut ui_auth = lcu_auth.lock().unwrap();
            if !cmd_output.auth_url.eq(&ui_auth.auth_url) {
                println!("auth_url: {}", cmd_output.auth_url);
                *ui_auth = cmd_output;
                repaint = true;
            }
        }

        let auth_url = lcu_auth.lock().unwrap().auth_url.clone();
        let full_url = format!("https://{}", auth_url);
        if let Ok(Some(cid)) = api::get_session(&full_url).await {
            let cur_id = champion_id.lock().unwrap().unwrap_or_default();
            if cur_id != cid {
                *champion_id.lock().unwrap() = Some(cid);
                repaint = true;
                println!("current champion id: {}", cid);
                *champion_changed.lock().unwrap() = true;
            }
        } else {
            *champion_id.lock().unwrap() = None;
            repaint = true;
        }

        {
            if repaint {
                let ui_ctx = ui_ctx.lock().unwrap();
                let ctx = ui_ctx.as_ref();
                match ctx {
                    Some(x) => {
                        x.request_repaint();
                    }
                    _ => (),
                };
            }
        }

        tokio::time::sleep(Duration::from_millis(2500)).await;
    }
}

pub async fn run() -> Result<(), eframe::Error> {
    let ui_cc: Arc<Mutex<Option<egui::Context>>> = Arc::new(Mutex::new(None));
    let ui_cc_clone = ui_cc.clone();

    let lcu_auth = Arc::new(Mutex::new(CommandLineOutput::default()));
    let lcu_auth_ui = lcu_auth.clone();
    let champion_id = Arc::new(Mutex::new(None));
    let champion_id_ui = champion_id.clone();
    let champion_changed = Arc::new(Mutex::new(false));
    let champion_changed_ui = champion_changed.clone();

    let watch_task_handle = tokio::spawn(async move {
        watch(ui_cc, lcu_auth, champion_id, champion_changed).await;
    });
    let lcu_task_handle = Some(watch_task_handle.abort_handle());

    let native_options = eframe::NativeOptions {
        initial_window_size: Some(egui::vec2(400.0, 500.0)),
        always_on_top: true,
        ..Default::default()
    };
    eframe::run_native(
        "Runes",
        native_options,
        Box::new(move |cc| {
            // This gives us image support:
            egui_extras::install_image_loaders(&cc.egui_ctx);
            let _ = &cc
                .egui_ctx
                .add_bytes_loader(Arc::new(AssetLoader::default()));

            ui_cc_clone.lock().unwrap().replace(cc.egui_ctx.clone());
            Box::new(ui::RuneApp::new(
                lcu_task_handle,
                lcu_auth_ui,
                champion_id_ui,
                champion_changed_ui,
            ))
        }),
    )?;
    Ok(())
}
