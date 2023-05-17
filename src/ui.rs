use std::sync::{Arc, Mutex};

use crate::web_service::{ChampionsMap, SourceItem};

#[derive(Default)]
pub struct ChampR {
    pub default_checkbox: bool,
    pub custom_checkbox: bool,
    pub source_list: Arc<Mutex<Vec<SourceItem>>>,
    pub selected_sources: Arc<Mutex<Vec<String>>>,
    pub champions_map: Arc<Mutex<ChampionsMap>>,
}

impl ChampR {}
