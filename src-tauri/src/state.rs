use std::sync::{Arc, Mutex, mpsc};
use tauri::{AppHandle, Window};

use crate::{lcu, page_data};

#[derive(Clone, Debug)]
pub struct InnerState {
    pub lcu_client: lcu::LcuClient,
    pub app_handle: Arc<Mutex<Option<AppHandle>>>,
    pub main_window: Arc<Mutex<Option<Window>>>,
    pub page_data: Arc<Mutex<page_data::PageData>>,
}

impl InnerState {
    pub fn new() -> Self {
        Self {
            lcu_client: lcu::LcuClient::new(),
            app_handle: Arc::new(Mutex::new(None)),
            main_window: Arc::new(Mutex::new(None)),
            page_data: Arc::new(Mutex::new(page_data::PageData::new())),
        }
    }

    pub fn init(&mut self, handle: &AppHandle) {
        let handle = handle.clone();
        let mut ws = self.lcu_client.clone();

        tauri::async_runtime::spawn(async move {
            let _ = ws.prepare_data(&handle).await;
            ws.watch_cmd_output().await;
        });

        let (tx, rx) = mpsc::channel();
        tauri::async_runtime::spawn(async move {
            match page_data::PageData::init().await {
                Ok(r) => {
                    let _ = tx.send(r);
                },
                Err(e) => {
                    println!("{:?}", e);
                }
            };
        });
        let (ready, s, r, v, c) = rx.recv().unwrap();
        let mut p = self.page_data.lock().unwrap();
        p.ready = ready;
        p.source_list = s;
        p.rune_list = r;
        p.official_version = v;
        p.champion_map = c;

        println!("[inner state] init");
    }
}

pub struct GlobalState(pub Mutex<InnerState>);

impl GlobalState {
    pub fn init(inner: InnerState) -> Self {
        Self(Mutex::new(inner))
    }
}
