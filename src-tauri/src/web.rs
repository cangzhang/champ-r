use std::collections::HashMap;

use serde::{Deserialize, Serialize};
use serde_with::serde_as;

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct Source {
    pub label: String,
    pub value: String,
    pub is_aram: Option<bool>,
    pub is_urf: Option<bool>,
}

pub const CDN_UNPKG: &str = "https://unpkg.com";
pub const CDN_DDRAGON: &str = "https://ddragon.leagueoflegends.com";

pub async fn fetch_lol_latest_version() -> anyhow::Result<String> {
    let url = format!("{cdn}/api/versions.json", cdn = CDN_DDRAGON);
    let resp = reqwest::get(url).await?;
    let list = resp.json::<Vec<String>>().await?;
    Ok(list.first().unwrap().to_string())
}

#[serde_as]
#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ChampListResp {
    #[serde(rename = "type")]
    pub type_field: String,
    pub format: String,
    pub version: String,
    pub data: HashMap<String, ChampInfo>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
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

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
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

pub async fn fetch_champ_list(version: &String) -> anyhow::Result<ChampListResp> {
    let url = format!(
        "{cdn}/cdn/{version}/data/en_US/champion.json",
        cdn = CDN_DDRAGON,
        version = version
    );
    let resp = reqwest::get(url).await?;
    let data = resp.json::<ChampListResp>().await?;
    Ok(data)
}