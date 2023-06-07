use std::{sync::{Arc, Mutex}, thread, time};

use crate::cmd::{CommandLineOutput, self};

use super::api;

pub struct LcuClient {
    pub auth_url: Arc<Mutex<String>>,
    pub lcu_dir: Arc<Mutex<String>>,
    pub is_tencent: Arc<Mutex<bool>>,
    pub cur_champion_id: Arc<Mutex<Option<u64>>>,
}

impl LcuClient {
    pub fn new(auth_url: Arc<Mutex<String>>, is_tencent:  Arc<Mutex<bool>>, lcu_dir: Arc<Mutex<String>>, cur_champion_id: Arc<Mutex<Option<u64>>>) -> Self {
        Self {
            auth_url,
            is_tencent,
            lcu_dir,
            cur_champion_id,
        }
    }

    pub async fn start(&mut self) {
        loop {
            let CommandLineOutput {
                auth_url,
                is_tencent,
                dir,
                ..
            } = cmd::get_commandline();

            *self.auth_url.lock().unwrap() = auth_url.clone();
            *self.is_tencent.lock().unwrap() = is_tencent;
            *self.lcu_dir.lock().unwrap() = dir.clone();

            if !auth_url.is_empty() {
                if let Ok(Some(champion_id)) = api::get_session(&auth_url).await {
                    let mut current_champion_id = self.cur_champion_id.lock().unwrap();
                    if current_champion_id.unwrap_or(0) != champion_id {
                        *current_champion_id = Some(champion_id);
                        dbg!(*current_champion_id);
                    }
                } else {
                    let mut current_champion_id = self.cur_champion_id.lock().unwrap();
                    *current_champion_id = None;
                    dbg!(*current_champion_id);
                }
            }

            thread::sleep(time::Duration::from_millis(2500));
        }
    }
}