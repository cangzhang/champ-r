use std::sync::{mpsc, Arc, Mutex};
use tauri::{async_runtime, AppHandle, Window};

use crate::{lcu, page_data};

#[derive(Clone, Debug)]
pub struct InnerState {
    pub lcu_client: Arc<Mutex<lcu::LcuClient>>,
    pub app_handle: Arc<Mutex<Option<AppHandle>>>,
    pub main_window: Arc<Mutex<Option<Window>>>,
    pub page_data: Arc<Mutex<page_data::PageData>>,
}

impl InnerState {
    pub fn new() -> Self {
        Self {
            lcu_client: Arc::new(Mutex::new(lcu::LcuClient::new())),
            app_handle: Arc::new(Mutex::new(None)),
            main_window: Arc::new(Mutex::new(None)),
            page_data: Arc::new(Mutex::new(page_data::PageData::new())),
        }
    }

    pub fn init(&mut self, handle: &AppHandle) {
        let handle1 = handle.clone();
        let lcu = self.lcu_client.clone();
        let (tx, rx) = mpsc::channel();
        
        async_runtime::spawn(async move {
            match page_data::PageData::init().await {
                Ok((ready, s, r, v, c)) => {
                    let mut lcu = lcu.lock().unwrap();
                    lcu.champion_map = c.clone();
                    println!("[state] init lcu client");

                    let _ = tx.send((ready, s, r, v, c));
                }
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

        println!("[state] init page data");

        let lcu = self.lcu_client.clone();
        async_std::task::spawn(async move {
            let mut l = lcu.lock().unwrap();
            l.watch_lcu(&Some(handle1));
        });
    }
}

pub struct GlobalState(pub Mutex<InnerState>);

impl GlobalState {
    pub fn init(inner: InnerState) -> Self {
        Self(Mutex::new(inner))
    }
}
