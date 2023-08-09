use std::sync::{Arc, Mutex};

use bytes::Bytes;

use crate::{
    config,
    source::SourceItem,
    web::{ChampionsMap, DataDragonRune}, builds::BuildData,
};

pub type LogItem = (String, String);

#[derive(Default)]
pub struct ChampR {
    pub source_list: Arc<Mutex<Vec<SourceItem>>>,
    pub selected_sources: Arc<Mutex<Vec<String>>>,
    pub champions_map: Arc<Mutex<ChampionsMap>>,
    pub lol_running: Arc<Mutex<bool>>,
    pub is_tencent: Arc<Mutex<bool>>,
    pub auth_url: Arc<Mutex<String>>,
    pub lcu_dir: Arc<Mutex<String>>,
    pub logs: Arc<Mutex<Vec<LogItem>>>, // (source, champion, position)
    pub current_champion_id: Arc<Mutex<Option<u64>>>,
    pub current_champion: Arc<Mutex<String>>,
    pub current_champion_build_data: Arc<Mutex<BuildData>>,
    pub app_config: Arc<Mutex<config::Config>>,
    pub loading_runes: Arc<Mutex<bool>>,
    pub current_champion_avatar: Arc<Mutex<Option<bytes::Bytes>>>,
    pub fetched_remote_data: Arc<Mutex<bool>>,
    pub remote_rune_list: Arc<Mutex<Vec<DataDragonRune>>>,
    pub rune_images: Arc<Mutex<Vec<(Bytes, Bytes, Bytes)>>>,
    pub applying_builds: bool,
    pub remote_version_info: Arc<Mutex<(String, String)>>,
    pub random_champion: Arc<Mutex<String>>,
    pub show_rune_modal: Arc<Mutex<bool>>,
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
        current_champion_build_data: Arc<Mutex<BuildData>>,
        app_config: Arc<Mutex<config::Config>>,
        loading_runes: Arc<Mutex<bool>>,
        current_champion_avatar: Arc<Mutex<Option<bytes::Bytes>>>,
        fetched_remote_data: Arc<Mutex<bool>>,
        remote_rune_list: Arc<Mutex<Vec<DataDragonRune>>>,
        rune_images: Arc<Mutex<Vec<(Bytes, Bytes, Bytes)>>>,
        remote_version_info: Arc<Mutex<(String, String)>>,
        show_rune_modal: Arc<Mutex<bool>>,
    ) -> Self {
        Self {
            auth_url,
            is_tencent,
            lcu_dir,
            logs,
            current_champion_id,
            champions_map,
            current_champion,
            current_champion_build_data,
            app_config,
            loading_runes,
            current_champion_avatar,
            fetched_remote_data,
            remote_rune_list,
            rune_images,
            remote_version_info,
            show_rune_modal,
            ..Default::default()
        }
    }

    pub fn open_web(url: String) {
        #[cfg(target_os = "windows")]
        std::process::Command::new("explorer")
            .arg(url)
            .spawn()
            .unwrap();
        #[cfg(target_os = "macos")]
        std::process::Command::new("open").arg(url).spawn().unwrap();
        #[cfg(all(not(target_os = "windows"), not(target_os = "macos")))]
        std::process::Command::new("xdg-open")
            .arg(url)
            .spawn()
            .unwrap();
    }

    pub fn random_rune(&mut self) {
        use rand::prelude::*;

        let champions_map = self.champions_map.lock().unwrap();
        let values = champions_map.iter().map(|(_k, v)| v).collect::<Vec<_>>();
        let rand_champ = values.choose(&mut thread_rng()).unwrap().to_owned();
        *self.current_champion.lock().unwrap() = rand_champ.id.clone();
        *self.current_champion_id.lock().unwrap() = Some(rand_champ.key.parse::<u64>().unwrap());
    }
}
