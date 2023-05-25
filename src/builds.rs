use futures::future; // StreamExt

use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::{
    fs,
    io::Write,
    path::Path,
    sync::{Arc, Mutex},
};

use crate::{
    ui::LogItem,
    web_service::{self, ChampionsMap, FetchError},
};

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildSection {
    pub index: i64,
    pub id: String,
    pub version: String,
    pub official_version: String,
    pub pick_count: i64,
    pub win_rate: String,
    pub timestamp: i64,
    pub alias: String,
    pub name: String,
    pub position: String,
    pub skills: Option<Vec<String>>,
    pub spells: Option<Vec<String>>,
    pub item_builds: Vec<ItemBuild>,
    pub runes: Vec<Rune>,
}

#[derive(Default, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemBuild {
    pub title: String,
    pub associated_maps: Vec<i64>,
    pub associated_champions: Vec<i64>,
    pub blocks: Vec<Block>,
    pub map: String,
    pub mode: String,
    pub preferred_item_slots: Option<Vec<Value>>,
    pub sortrank: i64,
    pub started_from: String,
    #[serde(rename = "type")]
    pub type_field: Option<String>,
}

#[derive(Default, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Block {
    #[serde(rename = "type")]
    pub type_field: String,
    pub items: Option<Vec<Item>>,
}

#[derive(Default, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub id: String,
    pub count: u8,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Rune {
    pub alias: String,
    pub name: String,
    pub position: String,
    pub pick_count: i64,
    pub win_rate: String,
    pub primary_style_id: i64,
    pub sub_style_id: i64,
    pub selected_perk_ids: Vec<i64>,
    pub score: Option<f64>,
    #[serde(rename = "type", default = "empty_rune_type")]
    pub type_field: String,
}

pub fn empty_rune_type() -> String {
    String::new()
}

pub async fn fetch_and_apply(
    dir: &String,
    source: &String,
    champion: &String,
) -> Result<(), FetchError> {
    let sections = match web_service::fetch_build_file(source, champion).await {
        Ok(s) => s,
        Err(_) => {
            return Err(FetchError::Failed);
        }
    };

    let source_name = source.replace('.', "_");
    for (idx, b) in sections.iter().enumerate() {
        let alias = &b.alias;
        let pos = &b.position;
        fs::create_dir_all(&dir).unwrap();

        for (iidx, item) in b.item_builds.iter().enumerate() {
            let full_path = format!("{dir}/{source_name}_{alias}_{pos}_{idx}_{iidx}.json");
            if Path::new(&full_path).exists() {
                let _ = fs::remove_file(&full_path);
                let _ = fs::remove_dir_all(&full_path);
            }

            let mut f = fs::File::create(&full_path).unwrap();
            let buf = serde_json::to_string_pretty(&item).unwrap();
            f.write_all(buf[..].as_bytes()).unwrap();
            println!("[builds::apply_builds_from_local] saved to: {}", &full_path);
        }
    }

    Ok(())
}

pub async fn batch_apply(
    selected_sources: Vec<String>,
    champions_map: ChampionsMap,
    dir: String,
    logs: Arc<Mutex<Vec<LogItem>>>,
) -> Result<(), ()> {
    let mut tasks = vec![];

    for (champion, _) in champions_map.iter() {
        for source in selected_sources.iter() {
            let dir = dir.clone();
            let source = source.clone();
            let logs = logs.clone();

            tasks.push(async move {
                let mut logs = logs.lock().unwrap();
                match fetch_and_apply(&dir, &source, champion).await {
                    Ok(_) => {
                        logs.push((source.clone(), champion.clone()));
                    }
                    Err(_) => {
                        println!("[apply builds] {:?} {:?}", &source, &champion);
                    }
                }
            });
        }
    }

    future::join_all(tasks).await;

    Ok(())
}

pub async fn do_nothing(
    sources: Vec<String>,
    champions_map: ChampionsMap,
    dir: String,
    logs: Arc<Mutex<Vec<LogItem>>>,
) -> Result<(), ()> {
    let mut tasks = vec![];
    // let sources = sources.lock().unwrap();

    for (i, _) in champions_map.iter() {
        for source in sources.iter() {
            let logs = logs.clone();
            let dir = dir.clone();
            let source = source.clone();

            let task = async move {
                std::thread::sleep(std::time::Duration::from_millis(200));
                let mut logs = logs.lock().unwrap();
                logs.push((source.clone(), dir.clone()));
                dbg!(i, source.clone());
            };

            tasks.push(task);
        }
    }

    future::join_all(tasks).await;

    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn apply_builds() -> Result<(), FetchError> {
        let target = String::from(".test");
        return fetch_and_apply(&target, &String::from("op.gg"), &String::from("Rengar")).await;
    }
}
