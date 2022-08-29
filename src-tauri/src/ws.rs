use http::HeaderValue;
use futures_util::{SinkExt, StreamExt};
use native_tls::TlsConnector;
use tokio_tungstenite::{
    connect_async_tls_with_config,
    tungstenite::{client::IntoClientRequest, protocol::WebSocketConfig, Message, Result},
    Connector,
};

/// Generate a random key for the `Sec-WebSocket-Key` header.
pub fn generate_key() -> String {
    // a base64-encoded (see Section 4 of [RFC4648]) value that,
    // when decoded, is 16 bytes in length (RFC 6455)
    let r: [u8; 16] = rand::random();
    base64::encode(&r)
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
    let (mut socket, _) = match connect_async_tls_with_config::<http::Request<()>>(
        req,
        Some(WebSocketConfig::default()),
        Some(connector),
    )
    .await {
        Ok(s) => {
            println!("connected");
            s
        }
        Err(e) => {
            panic!("{:?}", e);
        }
    };
    socket
        .send(Message::Text(r#"[5, "OnJsonApiEvent"]"#.to_string()))
        .await?;

    while let Some(msg) = socket.next().await {
        let msg = msg?;
        println!("{:?}", &msg.to_text());
    }
    
    Ok(())
}
