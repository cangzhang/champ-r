use futures::StreamExt;
use std::sync::{Arc, Mutex};

use crate::{builds, source_item::SourceItem, web_service::ChampionsMap};

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
}

impl ChampR {
    pub fn new(
        auth_url: Arc<Mutex<String>>,
        is_tencent: Arc<Mutex<bool>>,
        lcu_dir: Arc<Mutex<String>>,
    ) -> Self {
        Self {
            auth_url,
            is_tencent,
            lcu_dir,
            ..Default::default()
        }
    }

    pub async fn apply_builds_for_seleted_sources(&mut self) -> Result<Vec<()>, ()> {
        let sources = self.selected_sources.clone();
        let sources = sources.lock().unwrap();
        let champions_map = self.champions_map.clone();
        let champions_map = champions_map.lock().unwrap();
        let dir = self.lcu_dir.lock().unwrap();

        let mut tasks = vec![];
        for source in sources.iter() {
            for (champion, _v) in champions_map.iter() {
                let dir = dir.clone();
                let source = source.clone();
                tasks.push(async move {
                    let _r =
                        builds::apply_champion_builds_from_source(&dir, &source, &champion).await;
                });
            }
        }

        let r = futures::stream::iter(tasks)
            .buffer_unordered(10)
            .collect::<Vec<()>>()
            .await;
        Ok(r)
    }
}
