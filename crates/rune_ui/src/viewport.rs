use bytes::Bytes;
use eframe::egui;
use futures::future::join;
use poll_promise::Promise;
use std::sync::{Arc, Mutex, RwLock};

use lcu::{
    api::{self, Perk, SummonerChampion},
    builds::{self, Rune},
    cmd::CommandLineOutput,
    lcu_error::LcuError,
    source::SourceItem,
    web::{self, FetchError}, asset_loader::AssetLoader,
};

#[derive(Default)]
pub struct RuneUIState {
    pub sources: Vec<SourceItem>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub fetch_sources_promise: Option<Promise<Result<Vec<SourceItem>, web::FetchError>>>,
    pub all_champions: Vec<SummonerChampion>,
    pub all_perks: Vec<Perk>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub fetch_champions_and_perks_promise: Option<
        Promise<(
            Result<Vec<Perk>, LcuError>,
            Result<Vec<SummonerChampion>, LcuError>,
        )>,
    >,
    pub champion_id: Arc<Mutex<Option<i64>>>,
    pub champion_avatar_promise: Option<Promise<Result<Bytes, FetchError>>>,
    pub selected_source: String,
    pub builds: Vec<builds::BuildSection>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub fetch_build_file_promise:
        Option<Promise<Result<Vec<builds::BuildSection>, web::FetchError>>>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub apply_rune_promise: Option<Promise<Result<(), LcuError>>>,
    pub rune_to_apply: Option<Rune>,
    pub prev_champion_id: Option<i64>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub apply_builds_from_current_source_promise: Option<Promise<Result<(), FetchError>>>,
}

pub fn render_runes_ui(
    ctx: &egui::Context,
    ui_state: Arc<Mutex<RuneUIState>>,
    lcu_auth: Arc<RwLock<CommandLineOutput>>,
    champion_id: Arc<RwLock<Option<i64>>>,
) {
    egui_extras::install_image_loaders(ctx);
    let _ = &ctx.add_bytes_loader(Arc::new(AssetLoader::default()));

    let lcu_auth = lcu_auth.read().unwrap();
    let lcu_auth_url = lcu_auth.auth_url.clone();
    let is_tencent = lcu_auth.is_tencent;
    let dir = lcu_auth.dir.clone();

    let connected_to_lcu = !lcu_auth_url.is_empty();
    let full_auth_url = if connected_to_lcu {
        format!("https://{}", &lcu_auth_url)
    } else {
        String::new()
    };

    egui::CentralPanel::default().show(ctx, |ui| {
        if connected_to_lcu {
            let state = ui_state.clone();
            let ui_state = &mut *state.lock().unwrap();

            let cid = champion_id.read().unwrap().unwrap_or_default();

            ui.label(format!("Current champion id: {}", cid));

            if cid > 0 {
                let champion_avatar_url =
                    format!("lcu-{full_auth_url}/lol-game-data/assets/v1/champion-icons/{cid}.png");
                ui.add(
                    egui::Image::new(champion_avatar_url)
                        .max_size(egui::vec2(64., 64.))
                        .rounding(10.0),
                );
            }

            match &ui_state.fetch_champions_and_perks_promise {
                Some(p) => match p.ready() {
                    None => {
                        ui.spinner();
                    }
                    Some((perks_result, champions_result)) => {
                        match perks_result {
                            Ok(perks) => {
                                ui_state.all_perks = perks.clone();
                            }
                            Err(err) => {
                                ui.label(format!("Failed to list perks: {:?}", err));
                            }
                        };
                        match champions_result {
                            Ok(champions) => {
                                ui_state.all_champions = champions.clone();
                            }
                            Err(err) => {
                                ui.label(format!("Failed to list owned champions: {:?}", err));
                            }
                        };
                    }
                },
                None => {
                    let promise = Promise::spawn_async(async move {
                        join(api::list_all_perks(&full_auth_url.clone()), async {
                            let summoner = api::get_current_summoner(&full_auth_url).await?;
                            println!("summoner: {:?}", summoner.summoner_id);
                            api::list_available_champions(&full_auth_url, summoner.summoner_id)
                                .await
                        })
                        .await
                    });
                    ui_state.fetch_champions_and_perks_promise = Some(promise);
                }
            };

            ui.horizontal(|ui| {
                ui.label("Sources");
                match &ui_state.fetch_sources_promise {
                    Some(p) => match p.ready() {
                        None => {
                            ui.spinner();
                        }
                        Some(Ok(list)) => {
                            ui_state.sources = list.clone();
                            if ui_state.selected_source.is_empty() {
                                ui_state.selected_source = list[0].value.clone();
                            }

                            let prev_selected = ui_state.selected_source.clone();
                            egui::ComboBox::new("Source", "")
                                .width(200.)
                                .selected_text(&ui_state.selected_source)
                                .show_ui(ui, |ui| {
                                    list.iter().for_each(|item| {
                                        if ui
                                            .selectable_value(
                                                &mut ui_state.selected_source,
                                                item.value.clone(),
                                                &item.label,
                                            )
                                            .clicked()
                                            && !item.value.eq(&prev_selected)
                                        {
                                            ui_state.fetch_build_file_promise = None;
                                            ui_state.apply_builds_from_current_source_promise =
                                                None;
                                        };
                                    });
                                });
                        }
                        Some(Err(err)) => {
                            ui.label(format!("Failed to fetch sources: {:?}", err));
                        }
                    },
                    None => {
                        let promise =
                            Promise::spawn_async(async move { web::fetch_sources().await });
                        ui_state.fetch_sources_promise = Some(promise);
                    }
                };
            });

            if ui_state.prev_champion_id.unwrap_or_default() != cid {
                ui_state.fetch_build_file_promise = None;
                ui_state.rune_to_apply = None;
                ui_state.prev_champion_id = Some(cid);
                ui_state.apply_builds_from_current_source_promise = None;
            }
            if !ui_state.selected_source.is_empty() && cid > 0 {
                match &ui_state.fetch_build_file_promise {
                    Some(p) => match p.ready() {
                        None => {
                            ui.spinner();
                        }
                        Some(Ok(builds)) => {
                            ui_state.builds = builds.clone();

                            builds.iter().for_each(|build| {
                                build.runes.iter().for_each(|rune| {
                                    ui.label(&rune.name);
                                    ui.horizontal(|ui| {
                                        let primary_perk = ui_state
                                            .all_perks
                                            .iter()
                                            .find(|p| p.id == rune.selected_perk_ids[0]);
                                        let sub_perk = ui_state
                                            .all_perks
                                            .iter()
                                            .find(|p| p.id == rune.selected_perk_ids[1]);
                                        let last_perk = ui_state
                                            .all_perks
                                            .iter()
                                            .find(|p| p.id == rune.selected_perk_ids[2]);

                                        [primary_perk, sub_perk, last_perk].iter().for_each(
                                            |perk| {
                                                if perk.is_some() {
                                                    let p = (*perk).unwrap();
                                                    let perk_icon_url = format!(
                                                        "lcu-https://{}{}",
                                                        &lcu_auth_url, p.icon_path
                                                    );
                                                    ui.add(
                                                        egui::Image::new(perk_icon_url)
                                                            .max_size(egui::vec2(64., 64.))
                                                            .rounding(10.0),
                                                    );
                                                }
                                            },
                                        );

                                        if ui.button("Apply").clicked() {
                                            ui_state.rune_to_apply = Some(rune.clone());
                                        }
                                    });
                                });
                            });
                        }
                        Some(Err(err)) => {
                            ui.label(format!("Failed to fetch builds: {:?}", err));
                        }
                    },
                    None => {
                        let champion = &ui_state.all_champions.iter().find(|c| c.id == cid);
                        if champion.is_some() {
                            let c = (*champion).unwrap();
                            let source = ui_state.selected_source.clone();
                            let alias = &c.alias;
                            let champion_alias = alias.clone();
                            let promise = Promise::spawn_async(async move {
                                web::fetch_build_file(&source, &champion_alias, false).await
                            });
                            ui_state.fetch_build_file_promise = Some(promise);
                        }
                    }
                };

                if ui_state.rune_to_apply.is_some() {
                    let rune = ui_state.rune_to_apply.clone().unwrap();
                    let endpoint = format!("https://{}", &lcu_auth_url);

                    match &ui_state.apply_rune_promise {
                        Some(p) => match p.ready() {
                            None => {
                                ui.spinner();
                            }
                            Some(Ok(_)) => {
                                ui_state.apply_rune_promise = None;
                                ui_state.rune_to_apply = None;
                            }
                            Some(Err(err)) => {
                                println!("apply rune failed: {:?}", err);
                            }
                        },
                        None => {
                            let p = Promise::spawn_async(async move {
                                api::apply_rune(endpoint, rune).await
                            });
                            ui_state.apply_rune_promise = Some(p);
                        }
                    }
                }

                ui.horizontal(|ui| {
                    if ui
                        .button(format!("Apply builds from {}", ui_state.selected_source))
                        .clicked()
                    {
                        match &ui_state.apply_builds_from_current_source_promise {
                            Some(p) => match p.ready() {
                                None => {
                                    ui.spinner();
                                }
                                Some(Ok(_)) => {
                                    ui_state.apply_builds_from_current_source_promise = None;
                                }
                                Some(Err(err)) => {
                                    println!("apply builds failed: {:?}", err);
                                }
                            },
                            None => {
                                let selected_source = ui_state.selected_source.clone();
                                let target_champion =
                                    ui_state.all_champions.iter().find(|c| c.id == cid);
                                if target_champion.is_some() {
                                    let champion_name = target_champion.unwrap().alias.clone();
                                    let p = Promise::spawn_async(async move {
                                        builds::apply_builds_from_source(
                                            &dir,
                                            &selected_source,
                                            &champion_name,
                                            is_tencent,
                                        )
                                        .await
                                    });
                                    ui_state.apply_builds_from_current_source_promise = Some(p);
                                }
                            }
                        }
                    }
                });
            }
        }
    });
}
