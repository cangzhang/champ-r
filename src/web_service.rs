use std::collections::HashMap;

use futures::try_join;
use serde::{Deserialize, Serialize};

use crate::{
    builds::{self, Rune},
    source_item::SourceItem,
};
// use serde_json::Value;
// use serde_with::serde_as;

pub const SERVICE_URL: &str = "https://ql.lbj.moe";

#[derive(Debug, Clone)]
pub enum FetchError {
    Failed,
}

pub async fn fetch_sources() -> Result<Vec<SourceItem>, FetchError> {
    let url = format!("{SERVICE_URL}/api/sources");
    if let Ok(resp) = reqwest::get(url).await {
        if let Ok(list) = resp.json::<Vec<SourceItem>>().await {
            return Ok(list);
        }
    }

    Err(FetchError::Failed)
}

#[derive(Default, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChampInfo {
    pub version: String,
    pub id: String,
    pub key: String,
    pub name: String,
    pub title: String,
    // pub blurb: String,
    // pub info: Info,
    pub image: Image,
    pub tags: Vec<String>,
    // pub partype: String,
    // pub stats: Stats,
}

#[derive(Default, Debug, Clone, PartialEq, Eq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Image {
    pub full: String,
    pub sprite: String,
    pub group: String,
    pub x: u32,
    pub y: u32,
    pub w: u32,
    pub h: u32,
}

pub type ChampionsMap = HashMap<String, ChampInfo>;

pub async fn fetch_champion_list() -> Result<ChampionsMap, FetchError> {
    let url = format!("{SERVICE_URL}/api/data-dragon/versions/champions",);
    if let Ok(resp) = reqwest::get(url).await {
        if let Ok(data) = resp.json::<ChampionsMap>().await {
            return Ok(data);
        }
    }

    Err(FetchError::Failed)
}

pub async fn init_for_ui() -> Result<(Vec<SourceItem>, ChampionsMap), FetchError> {
    try_join!(fetch_sources(), fetch_champion_list())
}

pub async fn fetch_build_file(
    source: &String,
    champion: &String,
) -> Result<Vec<builds::BuildSection>, FetchError> {
    let url = format!("{SERVICE_URL}/api/detail?source={source}&champion={champion}");
    if let Ok(resp) = reqwest::get(url).await {
        if let Ok(data) = resp.json::<Vec<builds::BuildSection>>().await {
            return Ok(data);
        }
    }

    Err(FetchError::Failed)
}

pub async fn fetch_runes(source: String, champion: String) -> Result<Vec<Rune>, FetchError> {
    let builds = fetch_build_file(&source, &champion).await?;
    let runes = builds.iter().flat_map(|b| b.runes.clone()).collect();
    Ok(runes)
}
