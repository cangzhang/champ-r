//! A simple example of hooking up stdin/stdout to a WebSocket stream.
//!
//! This example will connect to a server specified in the argument list and
//! then forward all data read on stdin to the server, printing out all data
//! received on stdout.
//!
//! Note that this is not currently optimized for performance, especially around
//! buffer management. Rather it's intended to show an example of working with a
//! client.
//!
//! You can use this example together with the `server` example.

use futures_util::{SinkExt, StreamExt};
use native_tls::TlsConnector;
use tokio_tungstenite::{
    connect_async_tls_with_config,
    tungstenite::Result,
    Connector,
};

pub async fn start_client(connect_addr: &String) -> Result<()> {
    let url = reqwest::Url::parse(connect_addr).unwrap();
    let connector = Connector::NativeTls(
        TlsConnector::builder()
            .danger_accept_invalid_certs(true)
            .build()
            .unwrap(),
    );

    let (mut socket, _) = connect_async_tls_with_config(&url, None, Some(connector)).await?;
    while let Some(msg) = socket.next().await {
        let msg = msg?;
        println!("{:?}", &msg.to_text());
        if msg.is_text() || msg.is_binary() {
            socket.send(msg).await?;
        }
    }
    Ok(())
}
