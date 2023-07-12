use std::fs::{self, OpenOptions};
use std::path::Path;

use serde::{Deserialize, Serialize};
use std::fs::File;
use std::io::prelude::*;
use tracing::{error, info};

#[derive(Deserialize, Serialize, Default)]
pub struct Config {
    pub selected_sources: Vec<String>,
    pub rune_source: String,
}

const CONFIG_FILE_PATH: &str = ".settings.toml";

pub fn init_conf_file() -> Config {
    let mut f = File::create(CONFIG_FILE_PATH).unwrap();
    let conf = Config::default();
    let conf_str = toml::to_string(&conf).unwrap();
    f.write_all(conf_str.as_bytes()).unwrap();

    conf
}

pub fn save_config(conf: &Config) {
    let mut conf_file = OpenOptions::new()
        .read(true)
        .write(true)
        .open(CONFIG_FILE_PATH)
        .unwrap();
    let conf_str = toml::to_string(&conf).unwrap();
    match conf_file.write_all(conf_str.as_bytes()) {
        Ok(_) => {
            info!("config saved");
        }
        Err(e) => {
            error!("failed to save config: {}", e);
        }
    }
}

pub fn read_and_init() -> Config {
    if !Path::new(CONFIG_FILE_PATH).exists() {
        return init_conf_file();
    }

    if let Ok(content) = fs::read_to_string(CONFIG_FILE_PATH) {
        if let Ok(conf) = toml::from_str(&content) {
            return conf;
        }
    }

    fs::remove_file(CONFIG_FILE_PATH).unwrap();
    return init_conf_file();
}

impl Config {
    pub fn new() -> Self {
        Self {
            selected_sources: vec![],
            rune_source: String::from("op.gg"),
        }
    }

    pub fn set_rune_source(&mut self, source: String) {
        self.rune_source = source;

        self.save();
    }

    pub fn update_select_sources(&mut self, s: String) {
        if !self.selected_sources.contains(&s) {
            self.selected_sources.push(s);
        } else {
            let index = self.selected_sources.iter().position(|x| *x == s).unwrap();
            self.selected_sources.remove(index);
        }

        self.save();
    }

    pub fn save(&self) {
        save_config(self);
    }
}
