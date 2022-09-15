use std::sync::Mutex;

use crate::lcu;

#[derive(Clone, Debug)]
pub struct InnerState {
    pub ws_client: lcu::LcuClient,
}

impl InnerState {
    pub fn init() -> Self {
        let ws_client = lcu::LcuClient::new();
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
