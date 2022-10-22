use std::{collections::HashMap, sync::Arc};

use async_std::sync::Mutex;
use tauri::AppHandle;
use tokio::sync::mpsc;

use crate::{cmd, web, window};

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

    pub async fn watch_cmd_output(&mut self) {
        let (tx, mut rx) = mpsc::unbounded_channel();
        let handle = tokio::task::spawn_blocking(move || loop {
            let ret = cmd::get_commandline();
            match tx.send(ret) {
                Ok(_) => (),
                Err(e) => {
                    println!("{:?}", e.to_string());
                }
            };
            std::thread::sleep(std::time::Duration::from_millis(5000));
        });

        while let Some((auth_url, running, is_tencent, token, port)) = rx.recv().await {
            self.set_lcu_status(running);
            if !running {
                continue;
            }

            let updated = self.update_auth_url(&auth_url, &token, &port);
            if !updated {
                continue;
            }

            self.is_tencent = is_tencent;
            let _ = self.spawn_league_client().await;
        }

        handle.await.unwrap();
    }

    #[cfg(target_os = "windows")]
    pub async fn spawn_league_client(&mut self) -> anyhow::Result<()> {
        use std::io::{BufRead, BufReader, Error, ErrorKind};
        use std::path::Path;
        use std::process::{Command, Stdio};

        println!(
            "[spawn] LeagueClient eixsts? {:?}",
            Path::new("./LeagueClient.exe").exists()
        );
        println!("auth: {} {}", self.token, self.port);

        let handle = self.app_handle.clone().unwrap();
        let handle = handle.lock().await;
        let handle = handle.clone();

        let stdout = Command::new("./LeagueClient.exe")
            .args([&self.token, &self.port])
            .stdout(Stdio::piped())
            .spawn()?
            .stdout
            .ok_or_else(|| Error::new(ErrorKind::Other, "Could not capture standard output."))?;

        let reader = BufReader::new(stdout);
        let mut champ_id: i64 = 0;
        reader
            .lines()
            .filter_map(|line| line.ok())
            .for_each(|line| {
                if line.starts_with("=== champion id:") {
                    let champ_id_str = line.trim().replace("=== champion id:", "");
                    champ_id = champ_id_str.parse().unwrap();

                    if champ_id > 0 {
                        println!("[watch champ select] {champ_id}");
                        let champion_alias =
                            web::get_alias_from_champion_map(&self.champion_map, champ_id);
                        window::show_and_emit(&handle, champ_id, &champion_alias);
                    }
                }
            });

        Ok(())
    }

    #[cfg(not(target_os = "windows"))]
    pub async fn spawn_league_client() -> anyhow::Result<()> {
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn start() {
        let mut lcu = LcuClient::new();
        lcu.watch_cmd_output().await;
    }
}
