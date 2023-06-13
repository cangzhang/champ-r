use std::{
    sync::{Arc, Mutex},
    thread, time,
};

use crate::{
    builds::Rune,
    cmd::{self, CommandLineOutput},
    lcu::util::get_champion_alias,
    web_service::{fetch_runes, ChampionsMap},
};

use super::api;

pub struct LcuClient {
    pub champions_map: Arc<Mutex<ChampionsMap>>,
    // lcu auth
    pub auth_url: Arc<Mutex<String>>,
    pub lcu_dir: Arc<Mutex<String>>,
    pub is_tencent: Arc<Mutex<bool>>,
    // current session
    pub current_champion_id: Arc<Mutex<Option<u64>>>,
    pub current_champion: Arc<Mutex<String>>,
    pub current_champion_runes: Arc<Mutex<Vec<Rune>>>,
    pub current_source: Arc<Mutex<String>>,
    pub loading_runes: Arc<Mutex<bool>>,
}

impl LcuClient {
    pub fn new(
        auth_url: Arc<Mutex<String>>,
        is_tencent: Arc<Mutex<bool>>,
        lcu_dir: Arc<Mutex<String>>,
        current_champion_id: Arc<Mutex<Option<u64>>>,
        current_champion: Arc<Mutex<String>>,
        champions_map: Arc<Mutex<ChampionsMap>>,
        current_champion_runes: Arc<Mutex<Vec<Rune>>>,
        current_source: Arc<Mutex<String>>,
        loading_runes: Arc<Mutex<bool>>,
    ) -> Self {
        Self {
            auth_url,
            is_tencent,
            lcu_dir,
            champions_map,
            current_champion_id,
            current_champion,
            current_champion_runes,
            current_source,
            loading_runes,
        }
    }

    pub async fn start(&mut self) {
        loop {
            let CommandLineOutput {
                auth_url,
                is_tencent,
                dir,
                ..
            } = cmd::get_commandline();

            {
                let mut auth_url_guard = self.auth_url.lock().unwrap();
                *auth_url_guard = auth_url.clone();
                let mut is_tencent_guard = self.is_tencent.lock().unwrap();
                *is_tencent_guard = is_tencent;
                let mut lcu_dir_guard = self.lcu_dir.lock().unwrap();
                *lcu_dir_guard = dir.clone();
            }

            let mut should_fetch_runes: bool = false;

            if !auth_url.is_empty() {
                if let Ok(Some(champion_id)) = api::get_session(&auth_url).await {
                    let mut current_champion_id = self.current_champion_id.lock().unwrap();
                    let mut current_champion = self.current_champion.lock().unwrap();

                    if current_champion_id.unwrap_or(0) != champion_id {
                        let champions_map = self.champions_map.lock().unwrap();

                        *current_champion_id = Some(champion_id);
                        let champion_alias = get_champion_alias(&champions_map, champion_id);
                        *current_champion = champion_alias.clone();
                        should_fetch_runes = true;
                        dbg!(champion_id, champion_alias, should_fetch_runes);
                    }
                } else {
                    let mut current_champion_id = self.current_champion_id.lock().unwrap();
                    let mut current_champion = self.current_champion.lock().unwrap();
                    let mut current_champion_runes = self.current_champion_runes.lock().unwrap();

                    *current_champion_id = None;
                    *current_champion = String::new();
                    *current_champion_runes = vec![];
                }

                if should_fetch_runes {
                    let loading_runes_guard = self.loading_runes.clone();
                    *loading_runes_guard.lock().unwrap() = true;

                    let source = {
                        let source = self.current_source.lock().unwrap();
                        (*source).clone()
                    };
                    let champion = {
                        let champion = self.current_champion.lock().unwrap();
                        (*champion).clone()
                    };
                    if let Ok(runes) = fetch_runes(source, champion.clone()).await {
                        *self.current_champion_runes.lock().unwrap() = runes;
                    } else {
                        println!("failed to get builds");
                    }

                    *loading_runes_guard.lock().unwrap() = false;
                }
            }

            thread::sleep(time::Duration::from_millis(2500));
        }
    }
}
