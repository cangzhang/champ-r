#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use arc_swap::ArcSwap;
use kv_log_macro::{error, info};
use slint::{Image, Model, Rgba8Pixel, SharedPixelBuffer, SharedString, VecModel};
use std::{
    collections::HashMap,
    path::Path,
    rc::Rc,
    sync::{Arc, Mutex},
    time::Duration,
};

use lcu::{
    api::{self, Perk},
    cmd, web,
};

slint::include_modules!();

const INTERVAL: Duration = Duration::from_millis(2500);

struct UiBufferRune {
    name: String,
    position: String,
    rune_image1: SharedPixelBuffer<Rgba8Pixel>,
    rune_image2: SharedPixelBuffer<Rgba8Pixel>,
    rune_image3: SharedPixelBuffer<Rgba8Pixel>,
}

#[tokio::main]
async fn main() -> Result<(), slint::PlatformError> {
    femme::with_level(femme::LevelFilter::Info);

    let window = AppWindow::new()?;
    let rune_window = RuneWindow::new()?;

    let all_perks = Arc::new(ArcSwap::from_pointee(Vec::<Perk>::new()));
    let lcu_auth_url = Arc::new(ArcSwap::from_pointee(String::new()));
    let all_perk_images = Arc::new(Mutex::new(
        HashMap::<i32, SharedPixelBuffer<Rgba8Pixel>>::new(),
    ));

    let all_perks_clone = Arc::clone(&all_perks);
    let lcu_auth_url_clone = Arc::clone(&lcu_auth_url);
    let all_perk_images_clone = all_perk_images.clone();

    let weak_rune_win = rune_window.as_weak();
    rune_window.on_refetch_data(move |source, cid| {
        if source.is_empty() || cid == 0 {
            return;
        }

        info!("[rune_window] refetch data for {}, {}", cid, source);

        let all_perks_clone = Arc::clone(&all_perks_clone);
        let lcu_auth_url_clone = Arc::clone(&lcu_auth_url_clone);
        let all_perk_images_clone = all_perk_images_clone.clone();

        let weak_rune_win = weak_rune_win.clone();
        tokio::spawn(async move {
            let champion_id: i64 = cid.to_string().parse().unwrap_or_default();
            let lcu_auth_url = &*lcu_auth_url_clone.load();

            let runes = web::list_builds_by_id(&source.to_string(), champion_id).await;
            match runes {
                Ok(runes) => {
                    info!(
                        "[rune_window]: fetched {} rune items, champion id {}, source {}",
                        runes.len(),
                        cid,
                        source
                    );

                    let all_perks = &*all_perks_clone.load();
                    for b in runes.iter() {
                        for rune in b.runes.iter() {
                            let rune_ids = vec![rune.primary_style_id, rune.sub_style_id];
                            for rid in rune_ids {
                                if let Some(perk) = all_perks.iter().find(|p| p.style_id == rid) {
                                    match api::fetch_rune_image(&lcu_auth_url, &perk.icon_path)
                                        .await
                                    {
                                        Ok(bt) => {
                                            let img = image::load_from_memory(&bt).unwrap();
                                            let rgba_image = img.to_rgba8();
                                            let buffer =
                                                SharedPixelBuffer::<Rgba8Pixel>::clone_from_slice(
                                                    rgba_image.as_raw(),
                                                    rgba_image.width(),
                                                    rgba_image.height(),
                                                );
                                            all_perk_images_clone
                                                .lock()
                                                .unwrap()
                                                .insert(perk.style_id as i32, buffer);
                                        }
                                        Err(_) => {
                                            error!(
                                                "Failed to fetch rune image for {}",
                                                perk.icon_path
                                            );
                                        }
                                    }
                                }
                            }
                        }
                    }

                    let rune_list = runes
                        .iter()
                        .map(|r| {
                            let all_perk_images = all_perk_images_clone.lock().unwrap();
                            let r = &r.runes[0];
                            let pid = r.primary_style_id as i32;
                            let sid = r.sub_style_id as i32;
                            let primary_rune_img = all_perk_images.get(&pid).unwrap().clone();
                            let secondary_rune_img = all_perk_images.get(&sid).unwrap().clone();

                            UiBufferRune {
                                name: r.name.clone().into(),
                                position: r.position.clone().into(),
                                rune_image1: primary_rune_img,
                                rune_image2: secondary_rune_img,
                                rune_image3: SharedPixelBuffer::<Rgba8Pixel>::new(0, 0),
                            }
                        })
                        .collect::<Vec<UiBufferRune>>();
                    weak_rune_win
                        .upgrade_in_event_loop(move |rune_window| {
                            let ui_list = Rc::new(VecModel::from(
                                rune_list
                                    .iter()
                                    .map(|r| UiRune {
                                        name: r.name.clone().into(),
                                        position: r.position.clone().into(),
                                        rune_image1: Image::from_rgba8(r.rune_image1.clone()),
                                        rune_image2: Image::from_rgba8(r.rune_image2.clone()),
                                        rune_image3: Image::from_rgba8(r.rune_image3.clone()),
                                    })
                                    .collect::<Vec<UiRune>>(),
                            ));
                            rune_window.set_rune_list(ui_list.into());
                        })
                        .unwrap();
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
                lcu_auth_url.store(Arc::new(auth_url.clone()));
            }

            let auth_url_clone = auth_url.clone();
            let all_perks_clone = Arc::clone(&all_perks);
            if all_perks_clone.load().is_empty() {
                tokio::spawn(async move {
                    let perks = api::list_all_perks(&auth_url_clone).await;
                    match perks {
                        Ok(perks) => {
                            info!("fetched {} perks", perks.len());
                            all_perks_clone.store(Arc::new(perks));
                        }
                        Err(err) => {
                            error!("Failed to fetch perks: {:?}", err);
                        }
                    }
                });
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
