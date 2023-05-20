use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Debug, Clone)]
#[serde(rename_all = "camelCase")]
pub struct SourceItem {
    pub label: String,
    pub value: String,
    pub is_aram: Option<bool>,
    #[serde(rename(serialize = "isUrf", deserialize = "isURF"))]
    pub is_urf: Option<bool>,
}

impl SourceItem {
    pub fn get_mode_text(s: &Self) -> &'static str {
        if let Some(true) = s.is_aram {
            return "ARAM";
        }
        if let Some(true) = s.is_urf {
            return "URF";
        }

        "SR"
    }
}
