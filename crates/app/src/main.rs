#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use arc_swap::ArcSwap;
use bytes::Bytes;
use fltk::{app, button::Button, frame::Frame, group::Flex, image, prelude::*, window::Window};
use kv_log_macro::{error, info};
use std::{collections::HashMap, env, path::PathBuf, sync::Arc, time::Duration};

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
    SetChampionIcon(Bytes),
    UpdateChampionIconPath(PathBuf),
}

#[tokio::main]
async fn main() {
    femme::with_level(femme::LevelFilter::Info);

    let tmp_folder = env::temp_dir();

    let (s, r) = app::channel::<Message>();
    let main_app = app::App::default();
    let mut win = Window::new(0, 0, 400, 300, "ChampR").center_screen();
    win.make_resizable(true);

    let mut frame = Frame::default_fill();
    frame.set_label("loading...");

    let s_thread = s.clone();
    let s_thread_clone = s.clone();

    // shared variables
    let auth_url = Arc::new(ArcSwap::from(Arc::new(String::new())));
    let champion_id = ArcSwap::from(Arc::new(0 as i64));
    let auto_close_rune_window = Arc::new(ArcSwap::from(Arc::new(true)));

    tokio::spawn(async move {
        let sources = web::fetch_sources().await;

        match sources {
            Ok(sources) => {
                s_thread.send(Message::FetchedSources(sources));
            }
            Err(err) => {
                error!("Failed to fetch sources: {:?}", err);
            }
        }
    });

    let s_rune = s.clone();
    let auth_url_clone = Arc::clone(&auth_url);
    tokio::spawn(async move {
        // let mut prev_cid: i64 = 0;
        let sleep_duration = Duration::from_millis(2500);

        loop {
            let cmd_output = cmd::get_commandline();
            if cmd_output.auth_url.is_empty() {
                tokio::time::sleep(sleep_duration).await;
                continue;
            }

            let new_auth_url = format!("https://{}", cmd_output.auth_url);
            auth_url_clone.store(Arc::new(new_auth_url.clone()));

            if let Ok(cid) = api::get_session(&new_auth_url).await {
                let cid = cid.unwrap_or_default();
                let prev_cid = champion_id.load();
                if **prev_cid != cid {
                    info!("champion id changed to: {}", cid);
                    champion_id.store(Arc::new(cid));
                    s_rune.send(Message::UpdateCurrentChampionId(cid));
                    s_rune.send(Message::ToggleRuneWindow(true));
                }

                if cid == 0 {
                    s_rune.send(Message::ToggleRuneWindow(false));
                }
            } else {
                s_rune.send(Message::ToggleRuneWindow(false));
            }

            tokio::time::sleep(sleep_duration).await;
        }
    });

    let mut source_list_el = Flex::default_fill().column();
    let mut btn = Button::new(0, 0, 50, 300, "show rune window");
    let acrw = Arc::clone(&auto_close_rune_window);
    btn.set_callback(move |_| {
        acrw.store(Arc::new(false));
        s.send(Message::ToggleRuneWindow(true));
    });
    source_list_el.end();

    win.end();
    win.show();

    let mut rune_win = Window::new(0, 0, 400, 300, "Runes");
    // let mut top_row = Flex::new(0, 0, 300, 100, "Top row").row();
    let mut champion_frame = Frame::new(0, 20, 100, 100, "");
    // top_row.end();
    rune_win.end();

    let auth_url = Arc::clone(&auth_url);
    let acrw = Arc::clone(&auto_close_rune_window);
    while main_app.wait() {
        if let Some(msg) = r.recv() {
            match msg {
                Message::FetchedSources(sources) => {
                    // pack.clear();
                    frame.set_label("");
                    for source in sources {
                        let mut button = Button::new(0, 0, 400, 30, Some(source.label.as_str()));
                        button.set_callback({
                            move |_| {
                                info!("clicked {}", &source.value);
                            }
                        });
                        source_list_el.add(&button);
                    }
                    source_list_el.redraw();
                    // win.redraw();
                }

                Message::ToggleRuneWindow(show) => {
                    if show {
                        rune_win.show();
                    } else {
                        let auto_close = acrw.load();
                        if **auto_close {
                            rune_win.hide();
                        }
                    }
                }

                Message::UpdateCurrentChampionId(cid) => {
                    if cid > 0 {
                        let s = s_thread_clone.clone();
                        let auth_url = auth_url.load();
                        let idle = auth_url.is_empty();
                        if !idle {
                            let tmp_folder = tmp_folder.clone();
                            tokio::spawn(async move {
                                if let Ok(b) =
                                    lcu::api::get_champion_icon_by_id(&auth_url, cid).await
                                {
                                    // Save under tmp folder
                                    let file_path =
                                        tmp_folder.join(format!("champion_{}.png", cid));
                                    if !file_path.exists() {
                                        if let Err(e) = tokio::fs::write(&file_path, &b).await {
                                            error!("Failed to save champion icon: {:?}", e);
                                        }
                                    }
                                    s.send(Message::UpdateChampionIconPath(file_path));
                                }
                            });
                        }
                    }
                }

                Message::UpdateChampionIconPath(p) => {
                    if let Ok(mut img) = image::PngImage::load(p) {
                        img.scale(48, 48, true, true);
                        champion_frame.set_image(Some(img));
                        champion_frame.redraw();
                    } else {
                        error!("Failed to create png image from data");
                    }
                }

                _ => {}
            }
        }
    }
}
