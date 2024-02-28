use bytes::Bytes;
use eframe::egui;
use futures::future::join3;
use image::EncodableLayout;
use poll_promise::Promise;
use std::{
    collections::HashMap,
    sync::{Arc, RwLock},
};
use tokio::task::AbortHandle;

use lcu::{
    api::{self, Perk, RuneStyle, SummonerChampion},
    builds::{self, Rune},
    cmd::CommandLineOutput,
    lcu_error::LcuError,
    source::SourceItem,
    web::{self, FetchError},
};

#[derive(Default)]
pub struct RuneUI {
    pub lcu_auth: Arc<RwLock<CommandLineOutput>>,
    pub lcu_task_handle: Option<AbortHandle>,
    pub sources: Vec<SourceItem>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub fetch_sources_promise: Option<Promise<Result<Vec<SourceItem>, FetchError>>>,
    pub all_champions: Vec<SummonerChampion>,
    pub all_perks: Vec<Perk>,
    pub all_styles: Vec<RuneStyle>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub fetch_champions_and_perks_promise: Option<
        Promise<(
            Result<Vec<Perk>, LcuError>,
            Result<Vec<SummonerChampion>, LcuError>,
            Result<Vec<RuneStyle>, LcuError>,
        )>,
    >,
    pub champion_id: Arc<RwLock<Option<i64>>>,
    pub champion_avatar_promise: Option<Promise<Result<Bytes, FetchError>>>,
    pub selected_source: String,
    pub builds: Vec<builds::BuildSection>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub list_builds_by_alias_promise:
        Option<Promise<Result<Vec<builds::BuildSection>, FetchError>>>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub apply_rune_promise: Option<Promise<Result<(), LcuError>>>,
    pub rune_to_apply: Option<Rune>,
    pub prev_champion_id: Option<i64>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub apply_builds_from_current_source_promise: Option<Promise<Result<(), FetchError>>>,
    pub rune_images: HashMap<String, Bytes>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub fetch_rune_promises: HashMap<String, Promise<Result<Bytes, FetchError>>>,
}

impl RuneUI {
    pub fn new(
        lcu_auth: Arc<RwLock<CommandLineOutput>>,
        lcu_task_handle: Option<AbortHandle>,
        champion_id: Arc<RwLock<Option<i64>>>,
    ) -> Self {
        Self {
            lcu_auth,
            lcu_task_handle,
            champion_id,
            ..Default::default()
        }
    }
}

impl eframe::App for RuneUI {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        let lcu_auth = self.lcu_auth.read().unwrap();
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
                let cid = self.champion_id.read().unwrap().unwrap_or_default();
    
                match &self.fetch_champions_and_perks_promise {
                    Some(p) => match p.ready() {
                        None => {
                            ui.spinner();
                        }
                        Some((perks_result, champions_result, styles_result)) => {
                            match perks_result {
                                Ok(perks) => {
                                    self.all_perks = perks.clone();
                                }
                                Err(err) => {
                                    ui.label(format!("Failed to list perks: {:?}", err));
                                }
                            };
                            match champions_result {
                                Ok(champions) => {
                                    self.all_champions = champions.clone();
    
                                    if cid > 0 {
                                        let cur_champion = champions.iter().find(|c| c.id == cid);
                                        if let Some(champ) = cur_champion {
                                            let champion_icon = format!(
                                                "https://game.gtimg.cn/images/lol/act/img/champion/{}.png",
                                                &champ.alias
                                            );
                                            ui.add(
                                                egui::Image::new(champion_icon)
                                                    .max_size(egui::vec2(64., 64.))
                                                    .rounding(10.0),
                                            );
                                        }
                                    }
                                }
                                Err(err) => {
                                    ui.label(format!("Failed to list owned champions: {:?}", err));
                                }
                            };
                            match styles_result {
                                Ok(styles) => {
                                    self.all_styles = styles.clone();
                                }
                                Err(err) => {
                                    ui.label(format!("Failed to list styles: {:?}", err));
                                }
                            };
                        }
                    },
                    None => {
                        let promise = Promise::spawn_async(async move {
                            join3(api::list_all_perks(&full_auth_url.clone()), async {
                                let summoner = api::get_current_summoner(&full_auth_url).await?;
                                println!("[LCU] summoner: {:?}", summoner.summoner_id);
                                api::list_available_champions(&full_auth_url, summoner.summoner_id)
                                    .await
                            }, api::list_all_styles(&full_auth_url.clone()))
                                .await
                        });
                        self.fetch_champions_and_perks_promise = Some(promise);
                    }
                };
    
                ui.horizontal(|ui| {
                    ui.label("Sources");
                    match &self.fetch_sources_promise {
                        Some(p) => match p.ready() {
                            None => {
                                ui.spinner();
                            }
                            Some(Ok(list)) => {
                                self.sources = list.clone();
                                if self.selected_source.is_empty() {
                                    self.selected_source = list[0].value.clone();
                                }
    
                                let prev_selected = self.selected_source.clone();
                                egui::ComboBox::new("Source", "")
                                    .width(200.)
                                    .selected_text(&self.selected_source)
                                    .show_ui(ui, |ui| {
                                        list.iter().for_each(|item| {
                                            if ui
                                                .selectable_value(
                                                    &mut self.selected_source,
                                                    item.value.clone(),
                                                    &item.label,
                                                )
                                                .clicked()
                                                && !item.value.eq(&prev_selected)
                                            {
                                                self.list_builds_by_alias_promise = None;
                                                self.apply_builds_from_current_source_promise =
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
                            self.fetch_sources_promise = Some(promise);
                        }
                    };
                });
    
                ui.separator();
    
                if self.prev_champion_id.unwrap_or_default() != cid {
                    self.list_builds_by_alias_promise = None;
                    self.rune_to_apply = None;
                    self.prev_champion_id = Some(cid);
                    self.apply_builds_from_current_source_promise = None;
                }
                if !self.selected_source.is_empty() && cid > 0 {
                    match &self.list_builds_by_alias_promise {
                        Some(p) => match p.ready() {
                            None => {
                                ui.spinner();
                            }
                            Some(Ok(builds)) => {
                                self.builds = builds.clone();
    
                                builds.iter().for_each(|build| {
                                    build.runes.iter().for_each(|rune| {
                                        ui.label(&rune.name);
                                        ui.horizontal(|ui| {
                                            let primary_perk = self
                                                .all_perks
                                                .iter()
                                                .find(|p| p.id == rune.selected_perk_ids[0]);
                                            let sub_perk = self
                                                .all_styles
                                                .iter()
                                                .find(|p| p.id == rune.sub_style_id);
    
                                            let icon_paths = vec![
                                                primary_perk.map(|p| p.icon_path.clone()),
                                                sub_perk.map(|p| p.icon_path.clone()),
                                            ];
    
                                            icon_paths.iter().enumerate().for_each(
                                                |(idx, icon_path)| {
                                                    if icon_path.is_some() {
                                                        let icon_path = icon_path.as_ref().unwrap();
                                                        let perk_icon_url = format!(
                                                            "https://{}{}",
                                                            &lcu_auth_url, icon_path
                                                        );
                                                        let rune_image = self
                                                            .rune_images
                                                            .get(icon_path);
                                                        if rune_image.is_none() {
                                                            let promise = self
                                                                .fetch_rune_promises
                                                                .get(icon_path);
                                                            match promise {
                                                                Some(pm) => match pm.ready() {
                                                                    None => {
                                                                        ui.spinner();
                                                                    }
                                                                    Some(Ok(b)) => {
                                                                        self.rune_images.insert(icon_path.clone(), b.clone());
                                                                    }
                                                                    Some(Err(_)) => {
                                                                        println!("fetch rune image failed, {}", &icon_path);
                                                                    }
                                                                },
                                                                None => {
                                                                    self.fetch_rune_promises.insert(
                                                                        icon_path.clone(),
                                                                        Promise::spawn_async(
                                                                            async move {
                                                                                api::fetch_rune_image(
                                                                                    &perk_icon_url,
                                                                                )
                                                                                    .await
                                                                            },
                                                                        ),
                                                                    );
                                                                }
                                                            }
                                                        } else if let Some(b) = rune_image {
                                                            let pixels = b.as_bytes().to_vec();
                                                            let img = if idx == 0 {
                                                                egui::Image::from_bytes(format!("bytes://{}", &icon_path), pixels)
                                                                    .fit_to_exact_size(egui::vec2(32., 32.))
                                                                    .rounding(10.0)
                                                            } else {
                                                                egui::Image::from_bytes(format!("bytes://{}", &icon_path), pixels)
                                                                    .fit_to_exact_size(egui::vec2(20., 20.))
                                                                    .rounding(10.0)
                                                            };
                                                            ui.add(img);
                                                        }
                                                    }
                                                },
                                            );
    
                                            if ui.button("Apply").clicked() {
                                                self.rune_to_apply = Some(rune.clone());
                                            }
                                        });
                                        ui.separator();
                                    });
                                });
                            }
                            Some(Err(err)) => {
                                ui.label(format!("Failed to fetch builds: {:?}", err));
                            }
                        },
                        None => {
                            let champion = &self.all_champions.iter().find(|c| c.id == cid);
                            if champion.is_some() {
                                let c = (*champion).unwrap();
                                let source = self.selected_source.clone();
                                let alias = &c.alias;
                                let champion_alias = alias.clone();
                                let promise = Promise::spawn_async(async move {
                                    web::list_builds_by_alias(&source, &champion_alias).await
                                });
                                self.list_builds_by_alias_promise = Some(promise);
                            }
                        }
                    };
    
                    if self.rune_to_apply.is_some() {
                        let rune = self.rune_to_apply.clone().unwrap();
                        let endpoint = format!("https://{}", &lcu_auth_url);
    
                        match &self.apply_rune_promise {
                            Some(p) => match p.ready() {
                                None => {
                                    ui.spinner();
                                }
                                Some(Ok(_)) => {
                                    self.apply_rune_promise = None;
                                    self.rune_to_apply = None;
                                }
                                Some(Err(err)) => {
                                    println!("apply rune failed: {:?}", err);
                                }
                            },
                            None => {
                                let p = Promise::spawn_async(async move {
                                    api::apply_rune(endpoint, rune).await
                                });
                                self.apply_rune_promise = Some(p);
                            }
                        }
                    }
    
                    ui.horizontal(|ui| {
                        if ui
                            .button(format!("Apply builds from {}", self.selected_source))
                            .clicked()
                        {
                            match &self.apply_builds_from_current_source_promise {
                                Some(p) => match p.ready() {
                                    None => {
                                        ui.spinner();
                                    }
                                    Some(Ok(_)) => {
                                        self.apply_builds_from_current_source_promise = None;
                                    }
                                    Some(Err(err)) => {
                                        println!("apply builds failed: {:?}", err);
                                    }
                                },
                                None => {
                                    let selected_source = self.selected_source.clone();
                                    let target_champion =
                                        self.all_champions.iter().find(|c| c.id == cid);
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
                                        self.apply_builds_from_current_source_promise = Some(p);
                                    }
                                }
                            }
                        }
                    });
                }
            }
        });
    }
}
