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
            auth_url: String::from(""),
            is_lcu_running: false,
        }
    }

    pub fn start_lcu_task(&mut self) {
        let (tx, rx) = std::sync::mpsc::channel();
        let _handle = async_std::task::spawn(async move {
            let _id = tokio_js_set_interval::set_interval!(
                move || {
                    let ret = crate::cmd::get_commandline();
                    let tx = tx.clone();
                    let _r = tx.send(ret); // TODO! `sending on closed channel` error
                },
                3000
            );
        });

        let (auth_url, running) = match rx.recv() {
            Ok(r) => r,
            Err(_) => ("".to_string(), false),
        };

        self.is_lcu_running = running;
        if auth_url.eq(&self.auth_url) {
            return;
        }

        let mut url = String::from("wss://");
        url.push_str(&auth_url);
        println!("should update auth_url to {}", &auth_url);

        // let (tx, rx) = std::sync::mpsc::channel();
        async_std::task::spawn(async move {
            // let tx = tx.clone();
            let _ = start_client(&url).await;
        });
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
