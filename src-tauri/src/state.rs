use std::sync::Mutex;

use crate::ws;

#[derive(Clone, Debug)]
pub struct InnerState {
    pub ws_client: ws::LcuClient,
}

impl InnerState {
    pub fn init() -> Self {
        let ws_client = ws::LcuClient::new();
        let mut ws = ws_client.clone();
        async_std::task::spawn(async move {
            let _ = ws.watch_cmd_output().await;
        });
        
        Self {
            ws_client,
        }
    }
}

pub struct GlobalState(pub Mutex<InnerState>);

impl GlobalState {
    pub fn init() -> Self {
        Self(Mutex::new(InnerState::init()))
    }
}
