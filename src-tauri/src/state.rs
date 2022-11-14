use std::{
    collections::HashMap,
    sync::{Arc, Mutex},
};
use tauri::{AppHandle, Window};

use crate::{lcu, page_data, web, settings};

#[derive(Clone, Debug)]
pub struct InnerState {
    pub lcu_client: Arc<Mutex<lcu::LcuClient>>,
    pub app_handle: Arc<Mutex<Option<AppHandle>>>,
    pub main_window: Arc<Mutex<Option<Window>>>,
    pub page_data: Arc<Mutex<page_data::PageData>>,
    pub settings: Arc<Mutex<settings::Settings>>,
}

impl InnerState {
    pub fn new() -> Self {
        Self {
            lcu_client: Arc::new(Mutex::new(lcu::LcuClient::new())),
            app_handle: Arc::new(Mutex::new(None)),
            main_window: Arc::new(Mutex::new(None)),
            page_data: Arc::new(Mutex::new(page_data::PageData::new())),
            settings: Arc::new(Mutex::new(settings::Settings::load()))
        }
    }

    pub fn init_page_data(
        &mut self,
        ready: bool,
        source_list: &Vec<page_data::Source>,
        rune_list: &Vec<web::RuneListItem>,
        version: &String,
        champion_map: &HashMap<String, web::ChampInfo>,
    ) {
        let mut p = self.page_data.lock().unwrap();
        p.ready = ready;
        p.source_list = source_list.clone();
        p.rune_list = rune_list.clone();
        p.official_version = version.clone();
        p.champion_map = champion_map.clone();
    }

    pub fn init_settings(&mut self) {
        let mut s = self.settings.lock().unwrap();
        s.on_auto_start(None);
    }
}

pub struct GlobalState(pub Mutex<InnerState>);

impl GlobalState {
    pub fn init(inner: InnerState) -> Self {
        Self(Mutex::new(inner))
    }
}
