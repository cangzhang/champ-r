use std::{time::{Duration, self}, sync::{Arc, Mutex}, thread};

use serde_json::Value;

use crate::cmd::{CommandLineOutput, self};

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

pub async fn get_current_champion(auth_url: &String) -> Result<Option<u8>, reqwest::Error> {
    let endpoint = format!("https://{auth_url}/lol-champ-select/v1/session");
    let v = make_get_request(&endpoint).await?;

    dbg!(v);

    Ok(Some(0))
}

pub struct LcuClient {
    pub auth_url: Arc<Mutex<String>>,
    pub lcu_dir: Arc<Mutex<String>>,
    pub is_tencent: Arc<Mutex<bool>>,
    pub cur_champion_id: Arc<Mutex<Option<u8>>>,
}

impl LcuClient {
    pub fn new(auth_url: Arc<Mutex<String>>, is_tencent:  Arc<Mutex<bool>>, lcu_dir: Arc<Mutex<String>>, cur_champion_id: Arc<Mutex<Option<u8>>>) -> Self {
        Self {
            auth_url,
            is_tencent,
            lcu_dir,
            cur_champion_id,
        }
    }

    pub async fn start(&mut self) {
        loop {
            let CommandLineOutput {
                auth_url,
                is_tencent,
                dir,
                ..
            } = cmd::get_commandline();

            *self.auth_url.lock().unwrap() = auth_url.clone();
            *self.is_tencent.lock().unwrap() = is_tencent;
            *self.lcu_dir.lock().unwrap() = dir.clone();

            if !auth_url.is_empty() {
                if let Ok(Some(resp)) = get_current_champion(&auth_url).await {
                    dbg!(resp);
                    *self.cur_champion_id.lock().unwrap() = Some(0);
                }
            }

            thread::sleep(time::Duration::from_millis(2500));
        }
    }
}