use std::sync::{Arc, Mutex};

use crate::{source_item::SourceItem, web_service::ChampionsMap};

pub type LogItem = (String, String);

#[derive(Default)]
pub struct ChampR {
    pub source_list: Arc<Mutex<Vec<SourceItem>>>,
    pub selected_sources: Arc<Mutex<Vec<String>>>,
    pub champions_map: Arc<Mutex<ChampionsMap>>,
    pub fetched_remote_data: bool,
    pub lol_running: Arc<Mutex<bool>>,
    pub is_tencent: Arc<Mutex<bool>>,
    pub auth_url: Arc<Mutex<String>>,
    pub lcu_dir: Arc<Mutex<String>>,
    pub logs: Arc<Mutex<Vec<LogItem>>>, // (source, champion, position)
}

impl ChampR {
    pub fn new(
        auth_url: Arc<Mutex<String>>,
        is_tencent: Arc<Mutex<bool>>,
        lcu_dir: Arc<Mutex<String>>,
        logs: Arc<Mutex<Vec<LogItem>>>,
    ) -> Self {
        Self {
            auth_url,
            is_tencent,
            lcu_dir,
            logs,
            ..Default::default()
        }
    }
}
