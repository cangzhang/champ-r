use std::sync::{Arc, Mutex};

use futures_util::{SinkExt, StreamExt};
use http::HeaderValue;
use native_tls::TlsConnector;
use tokio::net::TcpStream;
use tokio_tungstenite::{
    connect_async_tls_with_config,
    tungstenite::{client::IntoClientRequest, protocol::WebSocketConfig, Message, Result},
    Connector, MaybeTlsStream, WebSocketStream,
};

pub struct LcuClient {
    pub socket: Option<Arc<Mutex<WebSocketStream<MaybeTlsStream<TcpStream>>>>>,
    pub auth_url: String,
    pub is_lcu_running: bool,
}

impl LcuClient {
    pub fn new() -> Self {
        Self {
            socket: None,
            auth_url: String::new(),
            is_lcu_running: false,
        }
    }

    pub async fn run_ps_task(&mut self, tx: std::sync::mpsc::Sender<(String, bool)>) -> Result<()> {
        let _h = std::thread::spawn(move || {
            let mut running = false;
            loop {
                let ret = crate::cmd::get_commandline();
                running = ret.1;
                let tx = tx.clone();
                let _ = tx.send(ret);
                std::thread::sleep(std::time::Duration::from_millis(5000));
            }
        });
        Ok(())
    }

    pub async fn start_lcu_task(&mut self) -> Result<()> {
        let (tx, rx) = std::sync::mpsc::channel();
        let _ = self.run_ps_task(tx).await;
        for (auth_url, running) in rx {
            self.is_lcu_running = running;
            if auth_url.eq(&self.auth_url) {
                continue;
            }

            let mut url = String::from("wss://");
            url.push_str(&auth_url);
            println!("should update auth_url to {}", &auth_url);
            let _ = start_client(&url).await;
        }
        Ok(())
    }
}

pub async fn start_client(connect_addr: &String) -> Result<()> {
    let url = reqwest::Url::parse(connect_addr).unwrap();
    let credentials = format!("{}:{}", url.username(), url.password().unwrap());
    let cred_value = HeaderValue::from_str(&format!("Basic {}", base64::encode(credentials)))?;
    let mut req = connect_addr.into_client_request()?;
    req.headers_mut().insert("Authorization", cred_value);
    let connector = Connector::NativeTls(
        TlsConnector::builder()
            .danger_accept_invalid_certs(true)
            .build()
            .unwrap(),
    );

    println!("[ws] start connection, {}", &connect_addr);
    let (mut socket, _) = connect_async_tls_with_config::<http::Request<()>>(
        req,
        Some(WebSocketConfig::default()),
        Some(connector),
    )
    .await?;
    socket
        .send(Message::Text(r#"[5, "OnJsonApiEvent"]"#.to_string()))
        .await?;

    while let Some(msg) = socket.next().await {
        let msg = msg?;
        println!("{:?}", &msg.to_text());
    }

    Ok(())
}

#[cfg(test)]
mod tests {
    #![allow(unused)]
    use super::*;

    #[tokio::test]
    async fn watch_lcu() {}
}
