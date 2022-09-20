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
}

impl PageData {
    pub fn new() -> Self {
        Self {
            source_list: vec![],
            rune_list: vec![],
            ready: false,
        }
    }

    pub async fn init(&mut self) -> anyhow::Result<()> {
        let (raw_list, rune_list) =
            future::join(builds::fetch_source_list(), web::fetch_latest_rune_list()).await;

        self.source_list = match raw_list {
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
        self.rune_list = match rune_list {
            Ok(list) => {
                println!("[page_data] got rune list.");
                list
            }
            Err(e) => {
                println!("[page_data] fetch rune list failed. {:?}", e);
                vec![]
            }
        };
        self.ready = true;

        Ok(())
    }
}
