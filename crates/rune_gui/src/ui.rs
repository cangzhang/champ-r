use bytes::Bytes;
use eframe::egui;
use futures::future::join;
use poll_promise::Promise;
use std::sync::{Arc, Mutex};
use tokio::task::AbortHandle;

use lcu::{
    api::{self, Perk, SummonerChampion},
    builds::{self, Rune},
    cmd::CommandLineOutput,
    lcu_error::LcuError,
    source::SourceItem,
    web::{self, FetchError},
};

#[derive(Default)]
pub struct RuneApp {
    pub url: String,
    pub lcu_auth: Arc<Mutex<CommandLineOutput>>,
    pub lcu_task_handle: Option<AbortHandle>,
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
    pub sources: Vec<SourceItem>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub fetch_sources_promise: Option<Promise<Result<Vec<SourceItem>, web::FetchError>>>,
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

impl RuneApp {
    pub fn new(
        lcu_task_handle: Option<AbortHandle>,
        lcu_auth: Arc<Mutex<CommandLineOutput>>,
        champion_id: Arc<Mutex<Option<i64>>>,
    ) -> Self {
        Self {
            lcu_task_handle,
            lcu_auth,
            champion_id,
            ..Default::default()
        }
    }
}

impl eframe::App for RuneApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        let auth = self.lcu_auth.lock().unwrap();
        let connected_to_lcu = !auth.auth_url.is_empty();
        let full_auth_url = if connected_to_lcu {
            format!("https://{}", auth.auth_url)
        } else {
            String::new()
        };

        egui::CentralPanel::default().show(ctx, |ui| {
            if connected_to_lcu {
                let cid = self.champion_id.lock().unwrap().unwrap_or_default();
                if cid > 0 {
                    let champion_avatar_url = format!(
                        "lcu-{full_auth_url}/lol-game-data/assets/v1/champion-icons/{cid}.png"
                    );
                    ui.add(
                        egui::Image::new(champion_avatar_url)
                            .max_size(egui::vec2(64., 64.))
                            .rounding(10.0),
                    );
                }

                match &self.fetch_champions_and_perks_promise {
                    Some(p) => match p.ready() {
                        None => {
                            ui.spinner();
                        }
                        Some((perks_result, champions_result)) => {
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
                                                self.fetch_build_file_promise = None;
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

                if self.prev_champion_id.unwrap_or_default() != cid {
                    self.fetch_build_file_promise = None;
                    self.rune_to_apply = None;
                    self.prev_champion_id = Some(cid);
                }
                if !self.selected_source.is_empty()
                    && self.champion_id.lock().unwrap().unwrap_or_default() > 0
                {
                    match &self.fetch_build_file_promise {
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
                                                .all_perks
                                                .iter()
                                                .find(|p| p.id == rune.selected_perk_ids[1]);
                                            let last_perk = self
                                                .all_perks
                                                .iter()
                                                .find(|p| p.id == rune.selected_perk_ids[2]);

                                            [primary_perk, sub_perk, last_perk].iter().for_each(
                                                |perk| {
                                                    if perk.is_some() {
                                                        let p = perk.clone().unwrap();
                                                        let perk_icon_url = format!(
                                                            "lcu-https://{}{}",
                                                            auth.auth_url, p.icon_path
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
                                                self.rune_to_apply = Some(rune.clone());
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
                            let champion = &self.all_champions.iter().find(|c| c.id == cid);
                            if champion.is_some() {
                                let c = champion.clone().unwrap();
                                let source = self.selected_source.clone();
                                let alias = &c.alias;
                                let champion_alias = alias.clone();
                                let promise = Promise::spawn_async(async move {
                                    web::fetch_build_file(&source, &champion_alias, false).await
                                });
                                self.fetch_build_file_promise = Some(promise);
                            }
                        }
                    };

                    if self.rune_to_apply.is_some() {
                        let rune = self.rune_to_apply.clone().unwrap();
                        let endpoint = format!("https://{}", &auth.auth_url);

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
                                    let dir = auth.dir.clone();
                                    println!("dir: {}", dir);
                                    let selected_source = self.selected_source.clone();
                                    let champion_id = self.champion_id.lock().unwrap().unwrap_or(0);
                                    let target_champion =
                                        self.all_champions.iter().find(|c| c.id == champion_id);
                                    if target_champion.is_some() {
                                        let champion_name = target_champion.unwrap().alias.clone();
                                        let p = Promise::spawn_async(async move {
                                            builds::fetch_and_apply(
                                                &dir,
                                                &selected_source,
                                                &champion_name,
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

    fn on_close_event(&mut self) -> bool {
        if let Some(handle) = &self.lcu_task_handle {
            handle.abort();
        }

        true
    }
}
