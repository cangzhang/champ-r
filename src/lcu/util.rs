use crate::web_service::ChampionsMap;

pub fn get_champion_alias(champions_map: &ChampionsMap, champion_id: u64) -> String {
    let champion_id_str = format!("{champion_id}");
    match champions_map.iter().find(|(_, v)| v.key == champion_id_str) {
        Some((_, v)) => v.id.clone(),
        None => String::new(),
    }
}