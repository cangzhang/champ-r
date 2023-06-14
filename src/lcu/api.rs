use std::time::Duration;

use bytes::Bytes;
use serde_json::Value;

use crate::{builds::Rune, web_service::FetchError};

pub fn make_client() -> reqwest::Client {
    reqwest::Client::builder()
        .use_rustls_tls()
        .danger_accept_invalid_certs(true)
        .timeout(Duration::from_secs(2))
        .no_proxy()
        .build()
        .unwrap()
}

pub async fn make_get_request(endpoint: &String) -> Result<Value, reqwest::Error> {
    let client = make_client();

    client
        .get(endpoint)
        .version(reqwest::Version::HTTP_2)
        .header(reqwest::header::ACCEPT, "application/json")
        .send()
        .await?
        .json::<serde_json::Value>()
        .await
}

pub async fn get_session(auth_url: &String) -> Result<Option<u64>, reqwest::Error> {
    let endpoint = format!("{auth_url}/lol-champ-select/v1/session");
    let resp = make_get_request(&endpoint).await?;

    if let Some(cell_id) = resp["localPlayerCellId"].as_u64() {
        let my_team = resp["myTeam"].as_array().unwrap();
        for i in my_team {
            let id = i["cellId"].as_u64().unwrap();
            if id == cell_id {
                let champ_id = i.get("championId").unwrap().as_u64().unwrap();
                return Ok(Some(champ_id));
            }
        }

        let actions = resp["actions"].as_array().unwrap();
        for row in actions {
            for i in row.as_array().unwrap() {
                let id = i["actorCellId"].as_u64().unwrap();
                if id == cell_id && i["type"].as_str().unwrap() != "ban" {
                    let champ_id = i.get("championId").unwrap().as_u64().unwrap();
                    return Ok(Some(champ_id));
                }
            }
        }
    };

    Ok(None)
}

#[derive(Debug, Clone)]
pub enum LcuError {
    APIError,
}

impl From<reqwest::Error> for LcuError {
    fn from(error: reqwest::Error) -> LcuError {
        dbg!(error);

        LcuError::APIError
    }
}

pub async fn apply_rune(endpoint: String, rune: Rune) -> Result<(), LcuError> {
    let runes = make_get_request(&format!("{endpoint}/lol-perks/v1/pages")).await?;
    
    let mut id = 0;
    for r in runes.as_array().unwrap() {
        if r["current"].as_bool().unwrap() {
            id = r["id"].as_i64().unwrap();
            break;
        }
        if r["isDeletable"].as_bool().unwrap() {
            id = r["id"].as_i64().unwrap();
        }
    }
    
    let client = make_client();
    if id > 0 {
        let _ = client
            .delete(format!("{endpoint}/lol-perks/v1/pages/{id}"))
            .version(reqwest::Version::HTTP_2)
            .header(reqwest::header::ACCEPT, "application/json")
            .send()
            .await?;
    }

    let _ = client
        .post(format!("{endpoint}/lol-perks/v1/pages"))
        .version(reqwest::Version::HTTP_2)
        .header(reqwest::header::ACCEPT, "application/json")
        .json(&rune)
        .send()
        .await?;
    Ok(())
}


pub async fn get_champion_avatar(endpoint: String, champion_id: u64) -> Result<Bytes, FetchError> {
    let client = make_client();
    let url = format!("{endpoint}/lol-game-data/assets/v1/champion-icons/{champion_id}.png");
    if let Ok(resp) = client.get(&url).send().await {
        if let Ok(bytes) = resp.bytes().await {
            return Ok(bytes);
        }
    }

    Err(FetchError::Failed)
}

pub async fn get_rune_image(endpoint: String, icon_path: String) -> Result<Bytes, FetchError> {
    let client = make_client();
    let url = format!("{endpoint}/lol-game-data/assets/v1/{icon_path}");
    if let Ok(resp) = client.get(&url).send().await {
        if let Ok(bytes) = resp.bytes().await {
            return Ok(bytes);
        }
    }

    Err(FetchError::Failed)
}