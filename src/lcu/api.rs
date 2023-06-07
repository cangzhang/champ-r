use std::time::Duration;

use serde_json::Value;

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
    let endpoint = format!("https://{auth_url}/lol-champ-select/v1/session");
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
