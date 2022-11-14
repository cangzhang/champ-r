use std::{env, thread};

use tauri::api;

#[derive(Clone, Debug, Default)]
pub struct Settings {
    pub auto_start: bool,
}

impl Settings {
    pub fn load() -> Self {
        let mut file = api::path::local_data_dir().unwrap();
        file.push(".settings");
        if !file.exists() {
            return Self { auto_start: false };
        }

        let file = file.to_str().unwrap();
        let json: serde_json::Value =
            serde_json::from_str(file).expect("JSON was not well-formatted");

        let auto_start = json["autoStart"].as_bool().unwrap_or_default();

        Self { auto_start }
    }

    pub fn on_auto_start(&mut self, status: Option<bool>) {
        let exe = env::current_exe().unwrap();
        let args = &["--minimized"];
        let auto = auto_launch::AutoLaunch::new("ChampR", exe.to_str().unwrap(), args);

        println!("[Settings] update auto_start to OS: {:?}", self.auto_start);

        let mut cur = self.auto_start;

        if let Some(s) = status {
            cur = s;
            self.auto_start = s;
        }

        thread::spawn(move || {
            if cur {
                println!("[Settings::on_auto_start] enable auto start, {:?}", auto.enable());
            } else {
                println!("[Settings::on_auto_start] disable auto start, {:?}", auto.disable());
            }
        });
    }
}
