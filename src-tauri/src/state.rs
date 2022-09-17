use std::sync::{Arc, Mutex};
use tauri::{AppHandle, Window};

use crate::lcu;

#[derive(Clone, Debug)]
pub struct InnerState {
    pub ws_client: lcu::LcuClient,
    pub app_handle: Arc<Mutex<Option<AppHandle>>>,
    pub main_window: Arc<Mutex<Option<Window>>>,
}

impl InnerState {
    pub fn new() -> Self {
        Self {
            ws_client: lcu::LcuClient::new(),
            app_handle: Arc::new(Mutex::new(None)),
            main_window: Arc::new(Mutex::new(None)),
        }
    }

    pub fn init(&mut self, handle: &AppHandle) {
        let mut ws = self.ws_client.clone();
        let handle = handle.clone();

        async_std::task::spawn(async move {
            println!("[inner state] spwan");
            let _ = ws.get_champion_map().await;
            let _ = ws.watch_cmd_output(Some(&handle)).await;
        });

        println!("[inner state] init");
    }
}

pub struct GlobalState(pub Mutex<InnerState>);

impl GlobalState {
    pub fn init(inner: InnerState) -> Self {
        Self(Mutex::new(inner))
    }
}
