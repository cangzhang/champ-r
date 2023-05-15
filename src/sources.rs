use serde::{Deserialize, Serialize};
// use serde_json::Value;
// use serde_with::serde_as;

pub const SERVICE_URL: &str = "https://ql.lbj.moe";

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SourceItem {
    pub label: String,
    pub value: String,
    pub is_aram: Option<bool>,
    #[serde(rename(serialize = "isUrf", deserialize = "isURF"))]
    pub is_urf: Option<bool>,
}

pub async fn get_sources() -> anyhow::Result<Vec<SourceItem>> {
    let url = format!("{SERVICE_URL}/api/sources");
    let resp = reqwest::get(url).await?;
    let list = resp.json::<Vec<SourceItem>>().await?;
    Ok(list)
}
