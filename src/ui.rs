use std::sync::{Arc, Mutex};

use crate::{source_item::SourceItem, web_service::ChampionsMap};

#[derive(Default)]
pub struct ChampR {
    pub source_list: Arc<Mutex<Vec<SourceItem>>>,
    pub selected_sources: Arc<Mutex<Vec<String>>>,
    pub champions_map: Arc<Mutex<ChampionsMap>>,
    pub fetched_remote_data: bool,
}

impl ChampR {}
