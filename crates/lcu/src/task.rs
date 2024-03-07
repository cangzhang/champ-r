use kv_log_macro::info;
use std::{
    sync::{Arc, RwLock},
    time::Duration,
};

use crate::{
    api,
    cmd::{self, CommandLineOutput},
    // constants::ALL_CHAMPION_IDS,
};

pub async fn watch_auth_and_champion(
    lcu_auth: Arc<RwLock<CommandLineOutput>>,
    champion_id: Arc<RwLock<Option<i64>>>,
) {
    loop {
        {
            let cmd_output = cmd::get_commandline();
            let mut ui_auth = lcu_auth.write().unwrap();
            if !cmd_output.auth_url.eq(&ui_auth.auth_url) {
                info!("auth_url: {}", cmd_output.auth_url);
                *ui_auth = cmd_output;
            }
        }

        let auth_url = { lcu_auth.read().unwrap().auth_url.clone() };
        if !auth_url.is_empty() {
            let full_url = format!("https://{}", auth_url);
            if let Ok(Some(cid)) = api::get_session(&full_url).await {
                let cur_id = champion_id.read().unwrap().unwrap_or_default();
                if cur_id != cid {
                    info!("champion changed: {}", cid);
                    *champion_id.write().unwrap() = Some(cid);
                }
            } else {
                *champion_id.write().unwrap() = None;
            }
        }

        tokio::time::sleep(Duration::from_millis(2000)).await;
    }
}

// fn get_random_champion_id() -> i64 {
//     use rand::seq::SliceRandom;

//     *ALL_CHAMPION_IDS.choose(&mut rand::thread_rng()).unwrap()
// }
