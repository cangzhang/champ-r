use std::{collections::HashMap, sync::Arc};

use async_std::sync::Mutex;
use futures_util::{SinkExt, StreamExt};
use http::HeaderValue;
use native_tls::TlsConnector;
use tauri::AppHandle;
use tokio::{net::TcpStream, sync::mpsc};
use tokio_tungstenite::{
    connect_async_tls_with_config,
    tungstenite::{client::IntoClientRequest, protocol::WebSocketConfig, Message},
    Connector, MaybeTlsStream, WebSocketStream,
};

use crate::{cmd, web, window};

#[derive(Clone, Debug, Default)]
pub struct LcuClient {
    pub socket: Option<Arc<Mutex<WebSocketStream<MaybeTlsStream<TcpStream>>>>>,
    pub auth_url: String,
    pub is_lcu_running: bool,
    pub app_handle: Option<Arc<Mutex<AppHandle>>>,
    pub champion_map: HashMap<String, web::ChampInfo>,
    pub is_tencent: bool,
}

impl LcuClient {
    pub fn new() -> Self {
        Self {
            socket: None,
            auth_url: String::from(""),
            is_lcu_running: false,
            app_handle: None,
            champion_map: HashMap::new(),
            is_tencent: false,
        }
    }

    pub fn update_auth_url(&mut self, url: &String) -> bool {
        if self.auth_url.eq(url) {
            return false;
        }

        self.auth_url = url.to_string();
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

    pub async fn close_ws(&mut self) {
        match &self.socket {
            None => (),
            Some(s) => {
                let mut s = s.lock().await;
                let _ = s.close(None);
            }
        }

        self.socket = None;
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

        while let Some((auth_url, running, is_tencent)) = rx.recv().await {
            self.set_lcu_status(running);

            if !running {
                self.close_ws().await;
                println!("== {:?}", self.socket);
                continue;
            }

            let updated = self.update_auth_url(&auth_url);
            if !updated {
                continue;
            }

            self.is_tencent = is_tencent;
            if is_tencent {
                self.close_ws().await;
                let _ = self.spawn_league_client().await;
            } else {
                let _ = self.conn_ws().await;
            }
        }

        handle.await.unwrap();
    }

    pub async fn conn_ws(&mut self) -> anyhow::Result<()> {
        let wsurl = format!("wss://{}", &self.auth_url);
        let url = reqwest::Url::parse(&wsurl).unwrap();
        let credentials = format!("{}:{}", url.username(), url.password().unwrap());

        let mut socket;
        loop {
            // retry in 2s if failed
            let mut req = url.to_string().into_client_request()?;
            let cred_value =
                HeaderValue::from_str(&format!("Basic {}", base64::encode(&credentials)))?;
            req.headers_mut().insert("Authorization", cred_value);

            let connector = Connector::NativeTls(
                TlsConnector::builder()
                    .danger_accept_invalid_certs(true)
                    .build()
                    .unwrap(),
            );
            match connect_async_tls_with_config::<http::Request<()>>(
                req,
                Some(WebSocketConfig::default()),
                Some(connector),
            )
            .await
            {
                Ok((s, _)) => {
                    socket = s;
                    break;
                }
                Err(_) => {
                    // server not ready
                    std::thread::sleep(std::time::Duration::from_millis(2000));
                }
            };
        }

        println!("[ws] connected, {}", &wsurl);
        socket
            .send(Message::Text(r#"[5, "OnJsonApiEvent"]"#.to_string()))
            .await?;

        let handle = self.app_handle.clone();
        while let Some(msg) = socket.next().await {
            let msg = msg?;
            let msg = msg.to_text().unwrap();
            if msg.contains("/lol-champ-select/v1/session") {
                let (_t, _ev, action): (
                    i32,
                    String,
                    std::collections::HashMap<String, serde_json::Value>,
                ) = serde_json::from_str(msg).unwrap();
                let data = action.get("data").unwrap();
                if let Some(my_team) = data.get("myTeam") {
                    let team = my_team.as_array().unwrap();
                    let my_cell_id = data.get("localPlayerCellId").unwrap();
                    let mut champion_id = 0;
                    for c in team {
                        if my_cell_id == c.get("cellId").unwrap() {
                            champion_id = c.get("championId").unwrap().as_i64().unwrap();
                            println!("current champion id: {}", champion_id);
                            break;
                        }
                    }

                    if let Some(h) = &handle {
                        let h = h.lock().await;
                        if champion_id > 0 {
                            let champion_alias =
                                web::get_alias_from_champion_map(&self.champion_map, champion_id);
                            window::show_and_emit(&h, champion_id, &champion_alias);
                        } else {
                            println!("[lcu::champion_id] hide popup");
                            window::toggle_rune_win(&h, Some(false));
                        }
                    }
                }
            }
        }

        self.socket = Some(Arc::new(Mutex::new(socket)));
        Ok(())
    }

    pub async fn on_ws_close(&mut self) {}

    #[cfg(target_os = "windows")]
    pub async fn spawn_league_client(&mut self) -> anyhow::Result<()> {
        use std::io::{BufRead, BufReader, Error, ErrorKind};
        use std::path::Path;
        use std::process::{Command, Stdio};

        println!(
            "[spawn] LeagueClient eixsts? {:?}",
            Path::new("./LeagueClient.exe").exists()
        );

        let handle = self.app_handle.clone().unwrap();
        let handle = handle.lock().await;
        let handle = handle.clone();

        let arr: Vec<String> = self.auth_url.split("@").map(|s| s.to_string()).collect();
        let token = arr[0].replace("riot:", "");
        let port = arr[1].replace("127.0.0.1:", "");

        let stdout = Command::new("./LeagueClient.exe")
            .args([&token, &port])
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
