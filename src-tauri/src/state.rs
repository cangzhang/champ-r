use std::sync::{Arc, Mutex};
use futures::future;
use tauri::{AppHandle, Window};

use crate::{lcu, page_data};

#[derive(Clone, Debug)]
pub struct InnerState {
    pub ws_client: lcu::LcuClient,
    pub app_handle: Arc<Mutex<Option<AppHandle>>>,
    pub main_window: Arc<Mutex<Option<Window>>>,
    pub page_data: page_data::PageData,
}

impl InnerState {
    pub fn new() -> Self {
        Self {
            ws_client: lcu::LcuClient::new(),
            app_handle: Arc::new(Mutex::new(None)),
            main_window: Arc::new(Mutex::new(None)),
            page_data: page_data::PageData::new(),
        }
    }

    pub fn init(&mut self, handle: &AppHandle) {
        let handle = handle.clone();        
        
        let mut ws = self.ws_client.clone();
        let mut pd = self.page_data.clone();
        async_std::task::spawn(async move {
            println!("[inner state] spawn");
            let _ = ws.prepare_data(&handle).await;
            let _ = future::join(ws.watch_cmd_output(), pd.init()).await;
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
