use bytes::Bytes;
use eframe::egui;
use futures::future::join;
use poll_promise::Promise;
use std::{
    sync::{Arc, Mutex},
    time::Duration,
};
use tokio::task::AbortHandle;

use lcu::{
    api::{self, Perk, SummonerChampion},
    asset_loader::AssetLoader,
    builds,
    cmd::{self, CommandLineOutput},
    lcu_error::LcuError,
    source::SourceItem,
    web::{self, FetchError},
};

async fn watch(
    ui_ctx: Arc<Mutex<Option<egui::Context>>>,
    lcu_auth: Arc<Mutex<CommandLineOutput>>,
    champion_id: Arc<Mutex<Option<i64>>>,
    champion_changed: Arc<Mutex<bool>>,
) {
    loop {
        println!(".");
        let mut repaint = false;

        {
            let cmd_output = cmd::get_commandline();
            let mut ui_auth = lcu_auth.lock().unwrap();
            if !cmd_output.auth_url.eq(&ui_auth.auth_url) {
                println!("auth_url: {}", cmd_output.auth_url);
                *ui_auth = cmd_output;
                repaint = true;
            }
        }

        let auth_url = lcu_auth.lock().unwrap().auth_url.clone();
        let full_url = format!("https://{}", auth_url);
        if let Ok(Some(cid)) = api::get_session(&full_url).await {
            let cur_id = champion_id.lock().unwrap().unwrap_or_default();
            if cur_id != cid {
                *champion_id.lock().unwrap() = Some(cid);
                repaint = true;
                println!("current champion id: {}", cid);
                *champion_changed.lock().unwrap() = true;
            }
        } else {
            *champion_id.lock().unwrap() = None;
            repaint = true;
        }

        {
            if repaint {
                let ui_ctx = ui_ctx.lock().unwrap();
                let ctx = ui_ctx.as_ref();
                match ctx {
                    Some(x) => {
                        x.request_repaint();
                    }
                    _ => (),
                };
            }
        }

        tokio::time::sleep(Duration::from_millis(2500)).await;
    }
}

#[derive(Default)]
pub struct App {
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
    pub champion_changed: Arc<Mutex<bool>>,
    pub champion_avatar_promise: Option<Promise<Result<Bytes, FetchError>>>,
    pub selected_source: String,
    pub sources: Vec<SourceItem>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub fetch_sources_promise: Option<Promise<Result<Vec<SourceItem>, web::FetchError>>>,
    pub builds: Vec<builds::BuildSection>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub fetch_build_file_promise:
        Option<Promise<Result<Vec<builds::BuildSection>, web::FetchError>>>,
}

impl App {
    pub fn new(
        lcu_task_handle: Option<AbortHandle>,
        lcu_auth: Arc<Mutex<CommandLineOutput>>,
        champion_id: Arc<Mutex<Option<i64>>>,
        champion_changed: Arc<Mutex<bool>>,
    ) -> Self {
        Self {
            lcu_task_handle,
            lcu_auth,
            champion_id,
            champion_changed,
            ..Default::default()
        }
    }
}

impl eframe::App for App {
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
                ui.label(format!("AUTH: {:?}", full_auth_url));

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
                                    ui.label(format!("perk count: {}", perks.len()));
                                }
                                Err(err) => {
                                    ui.label(format!("Failed to list perks: {:?}", err));
                                }
                            };
                            match champions_result {
                                Ok(champions) => {
                                    self.all_champions = champions.clone();
                                    ui.label(format!("champion count: {}", champions.len()));
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

                if *self.champion_changed.lock().unwrap() {
                    self.fetch_build_file_promise = None;
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
                                                    if let Some(p) = perk {
                                                        let perk_icon_url = format!(
                                                            "lcu-https://{}{}",
                                                            auth.auth_url,
                                                            p.icon_path
                                                        );
                                                        ui.add(
                                                            egui::Image::new(perk_icon_url)
                                                                .max_size(egui::vec2(64., 64.))
                                                                .rounding(10.0),
                                                        );
                                                    }
                                                },
                                            );
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
                            if let Some(c) = champion.clone() {
                                let source = self.selected_source.clone();
                                let alias = &c.alias;
                                let champion_alias = alias.clone();
                                let promise = Promise::spawn_async(async move {
                                    web::fetch_build_file(&source, &champion_alias, false).await
                                });
                                self.fetch_build_file_promise = Some(promise);
                                *self.champion_changed.lock().unwrap() = false;
                            }
                        }
                    };
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

pub async fn run() -> Result<(), eframe::Error> {
    let ui_cc: Arc<Mutex<Option<egui::Context>>> = Arc::new(Mutex::new(None));
    let ui_cc_clone = ui_cc.clone();

    let lcu_auth = Arc::new(Mutex::new(CommandLineOutput::default()));
    let lcu_auth_ui = lcu_auth.clone();
    let champion_id = Arc::new(Mutex::new(None));
    let champion_id_ui = champion_id.clone();
    let champion_changed = Arc::new(Mutex::new(false));
    let champion_changed_ui = champion_changed.clone();

    let watch_task_handle = tokio::spawn(async move {
        watch(ui_cc, lcu_auth, champion_id, champion_changed).await;
    });
    let lcu_task_handle = Some(watch_task_handle.abort_handle());

    let native_options = eframe::NativeOptions::default();
    eframe::run_native(
        "Runes",
        native_options,
        Box::new(move |cc| {
            // This gives us image support:
            egui_extras::install_image_loaders(&cc.egui_ctx);
            let _ = &cc
                .egui_ctx
                .add_bytes_loader(Arc::new(AssetLoader::default()));

            ui_cc_clone.lock().unwrap().replace(cc.egui_ctx.clone());
            Box::new(App::new(
                lcu_task_handle,
                lcu_auth_ui,
                champion_id_ui,
                champion_changed_ui,
            ))
        }),
    )?;
    Ok(())
}
