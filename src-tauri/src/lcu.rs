use std::{collections::HashMap, sync::Arc};

use async_std::sync::Mutex;
use futures::future;
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
    pub rune_list: Vec<web::RuneListItem>,
}

impl LcuClient {
    pub fn new() -> Self {
        Self {
            socket: None,
            auth_url: String::from(""),
            is_lcu_running: false,
            app_handle: None,
            champion_map: HashMap::new(),
            rune_list: vec![],
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

        let (champion_map, rune_list) = future::join(
            web::fetch_latest_champion_list(),
            web::fetch_latest_rune_list(),
        )
        .await;
        match champion_map {
            Ok(list) => {
                self.champion_map = list.data;
                println!("[lcu] got champion map, {}.", list.version);
            }
            Err(e) => {
                println!("[lcu] fetch champion list failed. {:?}", e);
            }
        };
        match rune_list {
            Ok(list) => {
                self.rune_list = list;
                println!("[lcu] got rune list.");
            }
            Err(e) => {
                println!("[lcu] fetch rune list failed. {:?}", e);
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
        self.auth_url = String::new();
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

        while let Some((auth_url, running)) = rx.recv().await {
            self.set_lcu_status(running);

            println!("[ws] is lcu running? {}", running);
            if !running {
                self.close_ws().await;
                println!("== {:?}", self.socket);
                continue;
            }

            let updated = self.update_auth_url(&auth_url);
            if !updated {
                continue;
            }

            let _ = self.conn_ws().await;
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
