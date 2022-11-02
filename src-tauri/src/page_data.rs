use std::collections::HashMap;

use futures::future;
use serde::{Deserialize, Serialize};

use crate::{builds, web};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Source {
    pub source: web::Source,
    pub sort: u8,
    pub source_version: String,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PageData {
    pub source_list: Vec<Source>,
    pub rune_list: Vec<web::RuneListItem>,
    pub ready: bool,
    pub official_version: String,
    pub champion_map: HashMap<String, web::ChampInfo>,
}

impl PageData {
    pub fn new() -> Self {
        Self {
            source_list: vec![],
            rune_list: vec![],
            ready: false,
            official_version: String::new(),
            champion_map: HashMap::new(),
        }
    }

    pub async fn init() -> anyhow::Result<(
        bool,
        Vec<Source>,
        Vec<web::RuneListItem>,
        String,
        HashMap<String, web::ChampInfo>,
    )> {
        let (raw_list, rune_list, champion_map) = future::join3(
            builds::fetch_source_list(),
            web::fetch_latest_rune_list(),
            web::fetch_latest_champion_list(),
        )
        .await;

        let source_list = match raw_list {
            Ok(l) => {
                let mut list = vec![];
                for (idx, i) in l.iter().enumerate() {
                    let source_version = web::get_latest_source_version(&i.value).await?;
                    list.push(Source {
                        source: i.clone(),
                        sort: idx as u8,
                        source_version,
                    });
                }
                list
            }
            Err(e) => {
                println!("[page_data] fetch source list failed, {:?}", e);
                vec![]
            }
        };
        let mut version = String::new();
        let rune_list = match rune_list {
            Ok((list, v)) => {
                version = v;
                list
            }
            Err(e) => {
                println!("[page_data] fetch rune list failed. {:?}", e);
                vec![]
            }
        };

        let champion_map = match champion_map {
            Ok(r) => r.data,
            Err(_) => HashMap::new(),
        };

        println!("[PageData::init] got rune & source list.");
        Ok((true, source_list, rune_list, version, champion_map))
    }
}
