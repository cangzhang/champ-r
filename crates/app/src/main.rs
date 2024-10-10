#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use kv_log_macro::{error, info};
use slint::{Image, Model, Rgba8Pixel, SharedPixelBuffer, SharedString, VecModel};
use std::rc::Rc;
use std::time::Duration;

use lcu::{api, cmd, web};

slint::include_modules!();

const INTERVAL: Duration = Duration::from_millis(2500);

#[tokio::main]
async fn main() -> Result<(), slint::PlatformError> {
    femme::with_level(femme::LevelFilter::Info);

    let window = AppWindow::new()?;
    let rune_window = RuneWindow::new()?;

    // let weak_rune_win = rune_window.as_weak();
    rune_window.on_refetch_data(move |source, cid| {
        info!("[rune_window] refetch data for {}, {}", cid, source);
        if source.is_empty() || cid == 0 {
            return;
        }

        info!("[rune_window] refetch data for {}, {}", cid, source);
        tokio::spawn(async move {
            let champion_id: i64 = cid.to_string().parse().unwrap_or_default();
            let runes = web::list_builds_by_id(&source.to_string(), champion_id).await;
            match runes {
                Ok(runes) => {
                    info!("[rune_window]: fetched runes {:?}", runes);
                }
                Err(err) => {
                    error!("[rune_window]: failed to fetch runes: {:?}", err);
                }
            };
        });
    });

    let weak_win = window.as_weak();
    let weak_rune_win = rune_window.as_weak();
    tokio::spawn(async move {
        let sources = web::fetch_sources().await;
        match sources {
            Ok(sources) => {
                info!("fetched source list");
                let mut list = sources
                    .iter()
                    .map(|s| UiSource {
                        name: s.label.clone().into(),
                        source: s.value.clone().into(),
                        checked: false,
                    })
                    .collect::<Vec<UiSource>>();
                list.sort_by(|a, b| a.name.to_lowercase().cmp(&b.name.to_lowercase()));

                weak_win
                    .upgrade_in_event_loop(move |window| {
                        let ui_list = Rc::new(VecModel::from(list));
                        window.set_source_list(ui_list.into());
                        info!("updated sources");
                    })
                    .unwrap();

                let mut list = sources
                    .iter()
                    .map(|s| s.value.clone().into())
                    .collect::<Vec<SharedString>>();
                list.sort_by_key(|a| a.to_lowercase());
                weak_rune_win
                    .upgrade_in_event_loop(move |rune_win| {
                        let list_ui = list.clone();
                        // let selected_source = list[0].clone();
                        let ui_list = Rc::new(VecModel::from(list_ui));
                        rune_win.set_source_list(ui_list.into());
                        rune_win.set_selected_source_index(0);

                        info!("rune_window: updated sources");
                    })
                    .unwrap();
            }
            Err(err) => {
                error!("Failed to fetch sources: {:?}", err);
            }
        }
    });

    let weak_win = window.as_weak();
    let weak_rune_window = rune_window.as_weak();
    tokio::spawn(async move {
        let mut prev_cid: i64 = 0;
        let mut prev_auth_url = String::new();

        loop {
            let cmd_output = cmd::get_commandline();
            if cmd_output.auth_url.is_empty() {
                weak_win
                    .upgrade_in_event_loop(move |window| {
                        window.set_lcu_running(false);
                    })
                    .unwrap();

                tokio::time::sleep(INTERVAL).await;
                continue;
            }

            let auth_url = format!("https://{}", cmd_output.auth_url);
            if !prev_auth_url.eq(&auth_url) {
                info!("lcu auth: {}", auth_url);
                prev_auth_url = auth_url.clone();
            }

            if let Ok(champion_id) = api::get_session(&auth_url).await {
                let cid = if champion_id.is_some() {
                    champion_id.unwrap()
                } else {
                    0
                };
                if prev_cid != cid {
                    info!("rune_window: champion id changed to: {}", cid);
                    prev_cid = cid;

                    if cid > 0 {
                        let weak_rune_window2 = weak_rune_window.clone();
                        tokio::spawn(async move {
                            match api::get_champion_icon_by_id(&auth_url, cid).await {
                                Ok(b) => {
                                    let img = image::load_from_memory(&b).unwrap();
                                    let rgba_image = img.to_rgba8();
                                    let buffer = SharedPixelBuffer::<Rgba8Pixel>::clone_from_slice(
                                        rgba_image.as_raw(),
                                        rgba_image.width(),
                                        rgba_image.height(),
                                    );
                                    weak_rune_window2
                                        .upgrade_in_event_loop(move |rune_window| {
                                            rune_window
                                                .set_champion_icon(Image::from_rgba8(buffer));
                                        })
                                        .unwrap();
                                    info!("fetched champion icon for id {}", cid);
                                }
                                Err(_) => {
                                    error!("Failed to fetch champion icon for id {}", cid);
                                }
                            };
                        });
                    }

                    weak_rune_window
                        .upgrade_in_event_loop(move |rune_window| {
                            rune_window.set_lcu_auth(cmd_output.auth_url.clone().into());
                            rune_window.set_champion_id(cid as i32);
                        })
                        .unwrap();
                }
            }

            weak_win
                .upgrade_in_event_loop(move |window| {
                    window.set_lcu_running(true);
                })
                .unwrap();
            tokio::time::sleep(INTERVAL).await;
        }
    });

    let weak_win = window.as_weak();
    window.on_apply_builds(move || {
        let win = weak_win.unwrap();
        let selected = win
            .get_source_list()
            .iter()
            .filter(|s| s.checked)
            .map(|s| s.source.into())
            .collect::<Vec<String>>();
        info!("Selected sources: {:?}", selected);
    });

    window.show()?;
    rune_window.show()?;
    slint::run_event_loop()?;
    Ok(())
}
