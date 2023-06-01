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

pub async fn get_current_champion(auth_url: String) -> Result<Option<u8>, reqwest::Error> {
    let endpoint = format!("https://{auth_url}/lol-champ-select/v1/session");
    let v = make_get_request(&endpoint).await?;

    dbg!(v);

    Ok(Some(0))
}