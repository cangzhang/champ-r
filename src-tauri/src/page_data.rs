use futures::future;
use serde::{Deserialize, Serialize};

use crate::{builds, web};

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct Source {
    pub source: web::Source,
    pub sort: u8,
}

#[derive(Serialize, Deserialize, Debug, Clone)]
pub struct PageData {
    pub source_list: Vec<Source>,
    pub rune_list: Vec<web::RuneListItem>,
}

impl PageData {
    pub fn new() -> Self {
        Self {
            source_list: vec![],
            rune_list: vec![],
        }
    }

    pub async fn init(&mut self) -> anyhow::Result<()> {
        let (raw_list, rune_list) =
            future::join(builds::fetch_source_list(), web::fetch_latest_rune_list()).await;

        let mut list: Vec<Source> = vec![];
        match raw_list {
            Ok(l) => {
              for (idx, i) in l.iter().enumerate() {
                list.push(Source {
                  source: i.clone(),
                  sort: idx as u8,
                });
              }
              self.source_list = list;
            },
            Err(e) => {
                println!("[page_data] fetch source list failed, {:?}", e);
            }
        }
        match rune_list {
            Ok(list) => {
                self.rune_list = list;
                println!("[page_data] got rune list.");
            }
            Err(e) => {
                println!("[page_data] fetch rune list failed. {:?}", e);
            }
        };
        Ok(())
    }
}
