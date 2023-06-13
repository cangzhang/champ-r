use std::sync::{Arc, Mutex};

use crate::{builds::Rune, source_item::SourceItem, web_service::ChampionsMap};

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
    pub current_champion_id: Arc<Mutex<Option<u64>>>,
    pub current_champion: Arc<Mutex<String>>,
    pub current_champion_runes: Arc<Mutex<Vec<Rune>>>,
    pub current_source: Arc<Mutex<String>>,
    pub loading_runes: Arc<Mutex<bool>>,
}

impl ChampR {
    pub fn new(
        auth_url: Arc<Mutex<String>>,
        is_tencent: Arc<Mutex<bool>>,
        lcu_dir: Arc<Mutex<String>>,
        logs: Arc<Mutex<Vec<LogItem>>>,
        current_champion_id: Arc<Mutex<Option<u64>>>,
        champions_map: Arc<Mutex<ChampionsMap>>,
        current_champion: Arc<Mutex<String>>,
        current_champion_runes: Arc<Mutex<Vec<Rune>>>,
        current_source: Arc<Mutex<String>>,
        loading_runes: Arc<Mutex<bool>>,
    ) -> Self {
        Self {
            auth_url,
            is_tencent,
            lcu_dir,
            logs,
            current_champion_id,
            champions_map,
            current_champion,
            current_champion_runes,
            current_source,
            loading_runes,
            ..Default::default()
        }
    }
}
