#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use bytes::Bytes;
use fltk::{app, button::Button, frame::Frame, group::{Flex, Pack}, prelude::*, window::Window};
use kv_log_macro::{error, info};
use std::{collections::HashMap, time::Duration};

use lcu::{api, builds, cmd, source, web};

#[derive(Default)]
pub struct AppData {
    pub source_list: Vec<source::SourceItem>,
    pub checked_sources: Vec<String>,
    pub lcu_running: bool,
    pub current_champion_id: i64,
    pub lcu_auth_url: String,

    // UI
    pub tabs: Vec<&'static str>,
    pub show_rune_window: bool,
    pub rune_source: String,
    pub runes: Vec<builds::Rune>,
    pub builds: Vec<builds::ItemBuild>,
    pub perks: Vec<api::Perk>,
    pub rune_images: HashMap<i64, Bytes>,
}

#[derive(Debug, Clone)]
pub enum Message {
    FetchedSources(Vec<source::SourceItem>),
    ToggleSource(String),
    UpdateLcuStatus(bool),
    UpdateCurrentChampionId(i64),
    SetLcuAuthUrl(String),
    ToggleRuneWindow(bool),
    CloseRuneWindow,
    SetRuneSource(String),
    UpdateBuilds(Vec<builds::BuildSection>),
    ReFetchRunes,
    SetPerks(Vec<api::Perk>),
    SetRuneImage(Bytes),
}

#[tokio::main]
async fn main() -> Result<(), Box<dyn std::error::Error>> {
    femme::with_level(femme::LevelFilter::Info);

    let (s, r) = app::channel::<Message>();
    let main_app = app::App::default();
    let mut win = Window::new(0, 0, 400, 300, "ChampR").center_screen();
    win.make_resizable(true);
    
    let mut frame = Frame::default_fill();
    frame.set_label("loading...");
    
    let s_thread = s.clone();
    tokio::spawn(async move {
        let sources = web::fetch_sources().await;
        
        match sources {
            Ok(sources) => {
                info!("Fetched sources: {:?}", sources);
                s_thread.send(Message::FetchedSources(sources));
            }
            Err(err) => {
                error!("Failed to fetch sources: {:?}", err);
            }
        }
    });
    
    let s_rune = s.clone();
    tokio::spawn(async move {
        let mut prev_cid: i64 = 0;
        let sleep_duration = Duration::from_millis(2500);

        loop {
            let cmd_output = cmd::get_commandline();
            if cmd_output.auth_url.is_empty() {
                tokio::time::sleep(sleep_duration).await;
                continue;
            }

            let auth_url = format!("https://{}", cmd_output.auth_url);
            if let Ok(champion_id) = api::get_session(&auth_url).await {
                let cid = champion_id.unwrap_or_default();
                if prev_cid != cid {
                    info!("champion id changed to: {}", cid);
                    prev_cid = cid;
                }
                s_rune.send(Message::ToggleRuneWindow(true));
            }

            tokio::time::sleep(sleep_duration).await;
        }
    });

    let mut pack = Flex::default_fill().column();
    let mut btn = Button::new(0, 0, 50, 300, "show rune window");
    pack.end();
    let s_btn = s.clone();
    btn.set_callback(move |_| {
        s_btn.send(Message::ToggleRuneWindow(true));
    });

    win.end();
    win.show();

    let mut rune_win = Window::new(0, 0, 400, 300, "Runes");
    rune_win.end();

    while main_app.wait() {
        if let Some(msg) = r.recv() {
            match msg {
                Message::FetchedSources(sources) => {
                    // pack.clear();
                    for source in sources {
                        let mut button = Button::new(0, 0, 400, 30, Some(source.label.as_str()));
                        button.set_callback({
                            move |_| {
                                info!("clicked {}", &source.value);
                            }
                        });
                        pack.add(&button);
                    }
                    pack.redraw();
                    win.redraw();
                }

                Message::ToggleRuneWindow(show) => {
                    if show {
                        rune_win.show();
                    }
                }
                _ => {}
            }
        }
    }

    Ok(())
}
