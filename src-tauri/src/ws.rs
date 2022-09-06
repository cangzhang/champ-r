use std::sync::Arc;

use async_std::sync::Mutex;
use futures_util::{SinkExt, StreamExt};
use http::HeaderValue;
use native_tls::TlsConnector;
use tokio::net::TcpStream;
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
}

impl LcuClient {
    pub fn new() -> Self {
        Self {
            socket: None,
            auth_url: String::from(""),
            is_lcu_running: false,
        }
    }

    pub fn update_auth_url(&mut self, url: &String) {
        if self.auth_url.eq(url) {
            return;
        }

        self.auth_url = url.to_string();
    }

    pub fn set_lcu_status(&mut self, s: bool) {
        self.is_lcu_running = s;
    }

    pub async fn start_lcu_task(&mut self) {
        let (auth_url, running) = crate::cmd::get_commandline();
        self.is_lcu_running = running;
        if auth_url.eq(&self.auth_url) {
            return;
        }

        self.auth_url = auth_url.to_string();
        println!("update auth_url to {}", &auth_url);
        let _ = self.conn_ws().await;
        let _ = self.subscribe().await;
    }

    pub async fn conn_ws(&mut self) -> anyhow::Result<()> {
        let wsurl = format!("wss://{}", &self.auth_url);
        let url = reqwest::Url::parse(&wsurl).unwrap();
        let credentials = format!("{}:{}", url.username(), url.password().unwrap());
        let cred_value = HeaderValue::from_str(&format!("Basic {}", base64::encode(credentials)))?;
        let mut req = self.auth_url.to_string().into_client_request()?;
        req.headers_mut().insert("Authorization", cred_value);
        let connector = Connector::NativeTls(
            TlsConnector::builder()
                .danger_accept_invalid_certs(true)
                .build()
                .unwrap(),
        );

        println!("[ws] start connection, {}", &wsurl);
        let (socket, _) = connect_async_tls_with_config::<http::Request<()>>(
            req,
            Some(WebSocketConfig::default()),
            Some(connector),
        )
        .await?;
        self.socket = Some(Arc::new(Mutex::new(socket)));
        Ok(())
    }

    pub async fn subscribe(&mut self) -> anyhow::Result<()> {
        let mut socket = self.socket.as_ref().clone().unwrap().lock().await;
        socket
            .send(Message::Text(r#"[5, "OnJsonApiEvent"]"#.to_string()))
            .await?;
        while let Some(msg) = socket.next().await {
            let msg = msg?;
            println!("{:?}", &msg.to_text());
        }

        Ok(())
    }

    pub async fn on_ws_close(&mut self) {}
}
