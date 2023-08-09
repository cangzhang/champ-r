use std::{
    sync::{Arc, Mutex},
    thread, time,
};

use bytes::Bytes;

#[allow(unused_imports)]
use tracing::{error, info};

use crate::builds::BuildData;
#[allow(unused_imports)]
use crate::{
    builds::Rune,
    cmd::{self, CommandLineOutput},
    config,
    lcu::util::get_champion_alias,
    web::{fetch_champion_runes, ChampionsMap, DataDragonRune},
};

#[allow(unused_imports)]
use super::api::{self, get_champion_avatar, get_rune_preview_images};

#[derive(Default)]
pub struct LcuClient {
    pub champions_map: Arc<Mutex<ChampionsMap>>,
    // lcu auth
    pub auth_url: Arc<Mutex<String>>,
    pub lcu_dir: Arc<Mutex<String>>,
    pub is_tencent: Arc<Mutex<bool>>,
    // current session
    pub current_champion_id: Arc<Mutex<Option<u64>>>,
    pub current_champion: Arc<Mutex<String>>,
    pub current_champion_build_data: Arc<Mutex<BuildData>>,
    pub loading_runes: Arc<Mutex<bool>>,
    pub current_champion_avatar: Arc<Mutex<Option<bytes::Bytes>>>,
    pub fetched_remote_data: Arc<Mutex<bool>>,
    pub remote_rune_list: Arc<Mutex<Vec<DataDragonRune>>>,
    pub rune_images: Arc<Mutex<Vec<(Bytes, Bytes, Bytes)>>>,
    pub app_config: Arc<Mutex<config::Config>>,
    pub random_champion: Arc<Mutex<String>>,
    pub show_rune_modal: Arc<Mutex<bool>>,
}

impl LcuClient {
    pub fn new(
        auth_url: Arc<Mutex<String>>,
        is_tencent: Arc<Mutex<bool>>,
        lcu_dir: Arc<Mutex<String>>,
        current_champion_id: Arc<Mutex<Option<u64>>>,
        current_champion: Arc<Mutex<String>>,
        champions_map: Arc<Mutex<ChampionsMap>>,
        current_champion_build_data: Arc<Mutex<BuildData>>,
        app_config: Arc<Mutex<config::Config>>,
        loading_runes: Arc<Mutex<bool>>,
        current_champion_avatar: Arc<Mutex<Option<bytes::Bytes>>>,
        fetched_remote_data: Arc<Mutex<bool>>,
        remote_rune_list: Arc<Mutex<Vec<DataDragonRune>>>,
        rune_images: Arc<Mutex<Vec<(Bytes, Bytes, Bytes)>>>,
        show_rune_modal: Arc<Mutex<bool>>,
    ) -> Self {
        Self {
            auth_url,
            is_tencent,
            lcu_dir,
            champions_map,
            current_champion_id,
            current_champion,
            current_champion_build_data,
            app_config,
            loading_runes,
            current_champion_avatar,
            fetched_remote_data,
            remote_rune_list,
            rune_images,
            show_rune_modal,
            ..Default::default()
        }
    }

    pub async fn start(&mut self) {
        loop {
            let fetched_remote_data = {
                let ready_guard = self.fetched_remote_data.lock().unwrap();
                *ready_guard
            };
            if !fetched_remote_data {
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
            #[allow(unused_mut, unused_variables)]
            let mut should_fetch_runes: bool = false;
            let current_champion = self.current_champion.lock().unwrap().clone();

            #[cfg(debug_assertions)]
            let should_continue = !current_champion.is_empty();
            #[cfg(not(debug_assertions))]
            let should_continue = !auth_url.is_empty();

            if should_continue {
                #[cfg(not(debug_assertions))]
                if let Ok(Some(champion_id)) = api::get_session(&auth_url).await {
                    let mut current_champion_id = self.current_champion_id.lock().unwrap();
                    let mut current_champion = self.current_champion.lock().unwrap();

                    if current_champion_id.unwrap_or(0) != champion_id {
                        let champions_map = self.champions_map.lock().unwrap();

                        *current_champion_id = Some(champion_id);
                        let champion_alias = get_champion_alias(&champions_map, champion_id);
                        *current_champion = champion_alias.clone();
                        should_fetch_runes = true;
                        info!("{champion_id}, {champion_alias}, {should_fetch_runes}");
                    }
                } else {
                    let mut current_champion_id = self.current_champion_id.lock().unwrap();
                    let mut current_champion = self.current_champion.lock().unwrap();
                    let mut current_champion_build_data = self.current_champion_build_data.lock().unwrap();

                    *current_champion_id = None;
                    *current_champion = String::new();
                    *current_champion_build_data = vec![];
                    *self.current_champion_avatar.lock().unwrap() = None;
                }

                let random_champion = self.random_champion.lock().unwrap().clone();

                #[cfg(debug_assertions)]
                let should_fetch_runes = !current_champion.eq(&random_champion);

                if should_fetch_runes {
                    *self.show_rune_modal.lock().unwrap() = true;

                    *self.current_champion_avatar.lock().unwrap() = None;
                    *self.current_champion_build_data.lock().unwrap() = BuildData::default();

                    let loading_runes_guard = self.loading_runes.clone();
                    *loading_runes_guard.lock().unwrap() = true;

                    let source = {
                        let conf = self.app_config.lock().unwrap();
                        conf.rune_source.clone()
                    };
                    let champion = {
                        let champion = self.current_champion.lock().unwrap();
                        (*champion).clone()
                    };
                    let champion_id = {
                        let champion_id = self.current_champion_id.lock().unwrap();
                        (*champion_id).unwrap_or(0)
                    };

                    *self.random_champion.lock().unwrap() = champion.clone();

                    if let Ok((champion_data, avatar_bytes)) = futures::future::try_join(
                        fetch_champion_runes(source, champion.clone()),
                        get_champion_avatar(auth_url, champion_id),
                    )
                    .await
                    {
                        *self.current_champion_build_data.lock().unwrap() = champion_data.clone();
                        *self.current_champion_avatar.lock().unwrap() = Some(avatar_bytes);
                        
                        let BuildData(runes, _builds) = champion_data;
                        let remote_rune_list = { self.remote_rune_list.lock().unwrap().clone() };
                        let auth_url = { self.auth_url.lock().unwrap().clone() };
                        let rune_images_guard = { self.rune_images.clone() };
                        let mut rune_images = vec![];

                        for rune in runes.iter() {
                            if let Ok(rune_image) = get_rune_preview_images(
                                auth_url.clone(),
                                rune.clone(),
                                &remote_rune_list,
                            )
                            .await
                            {
                                rune_images.push(rune_image);
                            }
                        }
                        *rune_images_guard.lock().unwrap() = rune_images;
                    } else {
                        error!("failed to get builds/avatar for {}", champion);
                    }

                    *loading_runes_guard.lock().unwrap() = false;
                }
            }

            thread::sleep(time::Duration::from_millis(2000));
        }
    }
}
