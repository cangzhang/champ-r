use std::{collections::HashMap, sync::{Arc, mpsc}};

use async_std::sync::Mutex;
use tauri::AppHandle;

use crate::{cmd, web};

#[derive(Clone, Debug, Default)]
pub struct LcuClient {
    pub token: String,
    pub port: String,
    pub auth_url: String,
    pub is_lcu_running: bool,
    pub app_handle: Option<Arc<Mutex<AppHandle>>>,
    pub champion_map: HashMap<String, web::ChampInfo>,
    pub is_tencent: bool,
}

impl LcuClient {
    pub fn new() -> Self {
        Self {
            ..Default::default()
        }
    }

    pub fn update_auth_url(&mut self, url: &String, token: &String, port: &String) -> bool {
        if self.auth_url.eq(url) {
            return false;
        }

        self.auth_url = url.to_string();
        self.token = token.to_string();
        self.port = port.to_string();

        println!("[LcuClient] updated auth url to {}", url);
        true
    }

    pub fn set_lcu_status(&mut self, s: bool) {
        self.is_lcu_running = s;
        if !s {}
    }

    pub async fn prepare_data(&mut self, handle: &AppHandle) {
        self.app_handle = Some(Arc::new(Mutex::new(handle.clone())));

        match web::fetch_latest_champion_list().await {
            Ok(list) => {
                self.champion_map = list.data;
                println!("[lcu] got champion map, {}.", list.version);
            }
            Err(e) => {
                println!("[lcu] fetch champion list failed. {:?}", e);
            }
        };
    }

    pub fn watch_lcu(&mut self, handle: &Option<AppHandle>) {
        let (tx, rx) = mpsc::channel();
        std::thread::spawn(move || {
            let tx = tx.clone();

            loop {
                let ret = cmd::get_commandline();
                let _ = tx.send(ret);
                std::thread::sleep(std::time::Duration::from_millis(5000));
            }
        });

        while let Ok((auth_url, running, is_tencent, token, port)) = rx.recv() {
            self.set_lcu_status(running);
            if !running {
                continue;
            }

            self.is_tencent = is_tencent;
            let updated = self.update_auth_url(&auth_url, &token, &port);
            if !updated {
                continue;
            }

            let champ_map = self.champion_map.clone();
            let handle = handle.clone();
            async_std::task::spawn(async move {
                let _ = cmd::spawn_league_client(&token, &port, &handle, &champ_map).await;
            });
        }
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn start() {
        let mut lcu = LcuClient::new();
        lcu.watch_lcu(&None);
    }
}
