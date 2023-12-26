use eframe::egui;
use std::{
    sync::{Arc, Mutex, RwLock},
    time::Duration,
};

use lcu::{
    api,
    cmd::{self, CommandLineOutput},
};

pub mod viewport;

pub async fn watch(
    ui_ctx: Arc<Mutex<Option<egui::Context>>>,
    lcu_auth: Arc<RwLock<CommandLineOutput>>,
    champion_id: Arc<RwLock<Option<i64>>>,
) {
    loop {
        println!(".");
        let mut repaint = false;

        {
            let cmd_output = cmd::get_commandline();
            let mut ui_auth = lcu_auth.write().unwrap();
            if !cmd_output.auth_url.eq(&ui_auth.auth_url) {
                println!("auth_url: {}", cmd_output.auth_url);
                *ui_auth = cmd_output;
                repaint = true;
            }
        }

        let auth_url = { lcu_auth.read().unwrap().auth_url.clone() };
        let full_url = format!("https://{}", auth_url);
        if let Ok(Some(cid)) = api::get_session(&full_url).await {
            let cur_id = champion_id.read().unwrap().unwrap_or_default();
            if cur_id != cid {
                *champion_id.write().unwrap() = Some(cid);
                repaint = true;
                println!("current champion id: {}", cid);
            }
        } else {
            *champion_id.write().unwrap() = None;
            repaint = true;
        }

        {
            if repaint {
                let ui_ctx = ui_ctx.lock().unwrap();
                if let Some(x) = ui_ctx.as_ref() {
                    x.request_repaint();
                }
            }
        }

        tokio::time::sleep(Duration::from_millis(2500)).await;
    }
}
