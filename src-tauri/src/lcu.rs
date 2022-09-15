use std::sync::Arc;

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

#[derive(Clone, Debug)]
pub struct LcuClient {
    pub socket: Option<Arc<Mutex<WebSocketStream<MaybeTlsStream<TcpStream>>>>>,
    pub auth_url: String,
    pub is_lcu_running: bool,
    pub app_handle: Arc<Mutex<Option<AppHandle>>>,
}

impl LcuClient {
    pub fn new() -> Self {
        Self {
            socket: None,
            auth_url: String::from(""),
            is_lcu_running: false,
            app_handle: Arc::new(Mutex::new(None)),
        }
    }

    pub async fn set_app_handle(&mut self, handle: &AppHandle) {
        let h = self.app_handle.clone();
        *h.lock().await = Some(handle.clone());
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

    pub async fn watch_cmd_output(&mut self, app_handle: Option<&AppHandle>) {
        let (tx, mut rx) = mpsc::unbounded_channel();
        let handle = tokio::task::spawn_blocking(move || loop {
            let ret = crate::cmd::get_commandline();
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

            let _ = self.conn_ws(app_handle).await;
        }

        handle.await.unwrap();
    }

    pub async fn conn_ws(&mut self, app_handle: Option<&AppHandle>) -> anyhow::Result<()> {
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
                    for c in team {
                        if my_cell_id == c.get("cellId").unwrap() {
                            let champion_id = c.get("championId").unwrap().as_i64().unwrap();
                            println!("current champion id: {}", champion_id);
                            if let Some(h) = app_handle {
                                if champion_id > 0 {
                                    crate::rune_window::toggle(h, Some(true));
                                }
                            }
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
        lcu.watch_cmd_output(None).await;
    }
}
