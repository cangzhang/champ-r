use eframe::egui;
use std::{
    sync::{Arc, Mutex, RwLock},
    time::Duration,
};

use crate::{
    api,
    cmd::{self, CommandLineOutput},
    constants::ALL_CHAMPION_IDS,
};

pub async fn watch_auth_and_champion(
    ui_ctx: Arc<Mutex<Option<egui::Context>>>,
    lcu_auth: Arc<RwLock<CommandLineOutput>>,
    champion_id: Arc<RwLock<Option<i64>>>,
    random_mode: Arc<Mutex<bool>>,
) {
    loop {
        let mut repaint = false;
        let enabled_random_mode = random_mode.lock().unwrap().clone();

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
                if cur_id == 0 && enabled_random_mode {
                    // do not clear champion id
                } else {
                    *champion_id.write().unwrap() = Some(cid);
                    repaint = true;
                }
                println!("current champion id: {}", cid);
            }
        } else {
            if enabled_random_mode {
                if champion_id.read().unwrap().is_none() {
                    *champion_id.write().unwrap() = Some(get_random_champion_id());
                }
            } else {
                *champion_id.write().unwrap() = None;
            }

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

fn get_random_champion_id() -> i64 {
    use rand::seq::SliceRandom;

    ALL_CHAMPION_IDS
        .choose(&mut rand::thread_rng())
        .unwrap()
        .clone()
}
