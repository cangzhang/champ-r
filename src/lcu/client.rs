use std::{
    sync::{Arc, Mutex},
    thread, time,
};

use bytes::Bytes;

use crate::{
    builds::Rune,
    cmd::{self, CommandLineOutput},
    lcu::util::get_champion_alias,
    web::{fetch_champion_runes, ChampionsMap, DataDragonRune},
};

use super::api::{self, get_champion_avatar, get_rune_preview_images};

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
    pub current_champion_avatar: Arc<Mutex<Option<bytes::Bytes>>>,
    pub fetched_remote_data: Arc<Mutex<bool>>,
    pub remote_rune_list: Arc<Mutex<Vec<DataDragonRune>>>,
    pub rune_images: Arc<Mutex<Vec<(Bytes, Bytes, Bytes)>>>,
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
        current_champion_avatar: Arc<Mutex<Option<bytes::Bytes>>>,
        fetched_remote_data: Arc<Mutex<bool>>,
        remote_rune_list: Arc<Mutex<Vec<DataDragonRune>>>,
        rune_images: Arc<Mutex<Vec<(Bytes, Bytes, Bytes)>>>,
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
            current_champion_avatar,
            fetched_remote_data,
            remote_rune_list,
            rune_images,
        }
    }

    pub async fn start(&mut self) {
        loop {
            let fetched_remote_data = {
                let ready_guard = self.fetched_remote_data.lock().unwrap();
                *ready_guard
            };
            if !fetched_remote_data {
                dbg!(fetched_remote_data);
                thread::sleep(time::Duration::from_millis(300));
                continue;
            }

            let CommandLineOutput {
                auth_url,
                is_tencent,
                dir,
                ..
            } = cmd::get_commandline();

            {
                *self.auth_url.lock().unwrap() = if !auth_url.is_empty() {
                    format!("https://{}", auth_url)
                } else {
                    String::new()
                };
                *self.is_tencent.lock().unwrap() = is_tencent;
                *self.lcu_dir.lock().unwrap() = dir.clone();
            }

            let auth_url = { self.auth_url.lock().unwrap().clone() };
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
                    *self.current_champion_avatar.lock().unwrap() = None;
                }

                if should_fetch_runes {
                    *self.current_champion_avatar.lock().unwrap() = None;
                    *self.current_champion_runes.lock().unwrap() = vec![];

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
                    let champion_id = {
                        let champion_id = self.current_champion_id.lock().unwrap();
                        (*champion_id).unwrap_or(0)
                    };

                    if let Ok((runes, avatar_bytes)) = futures::future::try_join(
                        fetch_champion_runes(source, champion.clone()),
                        get_champion_avatar(auth_url, champion_id),
                    )
                    .await
                    {
                        *self.current_champion_runes.lock().unwrap() = runes.clone();
                        *self.current_champion_avatar.lock().unwrap() = Some(avatar_bytes);

                        let remote_rune_list = {
                            self.remote_rune_list.lock().unwrap().clone()
                        };
                        let rune_images_guard = {
                            self.rune_images.clone()
                        };
                        let auth_url = { self.auth_url.lock().unwrap().clone() };

                        *rune_images_guard.lock().unwrap() = vec![];
                        tokio::task::spawn(async move {
                            let mut rune_images = vec![];

                            for rune in runes.iter() {
                                if let Ok(rune_image) = get_rune_preview_images(auth_url.clone(), rune.clone(), &remote_rune_list).await {
                                    rune_images.push(rune_image);
                                }
                            }
                            *rune_images_guard.lock().unwrap() = rune_images;
                        });
                    } else {
                        println!("failed to get builds/avatar for {}", champion);
                    }

                    *loading_runes_guard.lock().unwrap() = false;
                }
            }

            thread::sleep(time::Duration::from_millis(2500));
        }
    }
}
