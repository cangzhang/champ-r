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

const SR_ICON: &[u8] = include_bytes!("../../../assets/sr.png");
const ARAM_ICON: &[u8] = include_bytes!("../../../assets/aram.png");
const URF_ICON: &[u8] = include_bytes!("../../../assets/urf.png");

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

    pub fn get_mode_icon(s: &Self) -> &'static [u8] {
        if let Some(true) = s.is_aram {
            return ARAM_ICON;
        }
        if let Some(true) = s.is_urf {
            return URF_ICON;
        }

        SR_ICON
    }
}
