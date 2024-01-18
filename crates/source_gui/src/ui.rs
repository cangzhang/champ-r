use rune_ui::viewport::{render_runes_ui, RuneUIState};

use std::sync::{
    atomic::{AtomicBool, Ordering},
    Arc, Mutex, RwLock,
};
use tokio::task::AbortHandle;

use eframe::egui;
use kv_log_macro as log;
use poll_promise::Promise;

use lcu::{
    cmd::CommandLineOutput,
    source::SourceItem,
    web::{self},
};

use crate::toogle_ui;

#[cfg_attr(feature = "serde", derive(serde::Deserialize, serde::Serialize))]
#[derive(Default)]
pub struct SourceWindow {
    pub sources: Vec<SourceItem>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub sources_promise: Option<Promise<Result<Vec<SourceItem>, web::FetchError>>>,

    pub selected_sources: Vec<String>,
    pub lcu_auth: Arc<RwLock<CommandLineOutput>>,
    pub lcu_task_handle: Option<AbortHandle>,

    pub random_mode: Arc<Mutex<bool>>,
    pub champion_id: Arc<RwLock<Option<i64>>>,

    pub rune_viewport_ctx: Arc<Mutex<Option<egui::Context>>>,
    // rune viewport
    pub rune_ui_state: Arc<Mutex<RuneUIState>>,
    pub show_rune_viewport: Arc<AtomicBool>,
}

impl SourceWindow {
    pub fn new(
        lcu_auth: Arc<RwLock<CommandLineOutput>>,
        lcu_task_handle: Option<AbortHandle>,
        rune_viewport_ctx: Arc<Mutex<Option<egui::Context>>>,
        champion_id: Arc<RwLock<Option<i64>>>,
        random_mode: Arc<Mutex<bool>>,
    ) -> Self {
        Self {
            lcu_auth,
            lcu_task_handle,
            rune_viewport_ctx,
            champion_id,
            random_mode,
            ..Default::default()
        }
    }
}

impl eframe::App for SourceWindow {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        if ctx.input(|i| i.viewport().close_requested()) {
            if let Some(handle) = &self.lcu_task_handle {
                handle.abort();
            }
        }

        if self.champion_id.read().unwrap().is_some() {
            self.show_rune_viewport.store(true, Ordering::Relaxed);
        }

        if self.show_rune_viewport.load(Ordering::Relaxed) {
            let rune_ui_state = self.rune_ui_state.clone();
            let show_rune_viewport = self.show_rune_viewport.clone();
            let lcu_auth = self.lcu_auth.clone();
            let champion_id = self.champion_id.clone();

            ctx.show_viewport_deferred(
                egui::ViewportId::from_hash_of("runes_window"),
                egui::ViewportBuilder::default()
                    .with_title("Runes")
                    .with_inner_size([400., 500.])
                    .with_always_on_top(),
                move |ctx, class| {
                    assert!(
                        class == egui::ViewportClass::Deferred,
                        "This egui backend doesn't support multiple viewports"
                    );

                    render_runes_ui(
                        ctx,
                        rune_ui_state.clone(),
                        lcu_auth.clone(),
                        champion_id.clone(),
                    );

                    if ctx.input(|i| i.viewport().close_requested()) {
                        show_rune_viewport.store(false, Ordering::Relaxed);
                    }
                },
            );
        }

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.vertical_centered(|ui| {
                ui.label(
                    egui::RichText::new("ChampR")
                        .strong()
                        .heading()
                        .extra_letter_spacing(0.2)
                        .size(24.0),
                );
                ui.monospace("Builds, runes, all in one");
            });

            ui.add_space(8.);

            egui::ScrollArea::new([true, true]).show(ui, |ui| {
                match &self.sources_promise {
                    Some(p) => match p.ready() {
                        None => {
                            ui.spinner();
                        }
                        Some(Ok(list)) => {
                            self.sources = list.clone();

                            let mut indexes = list
                                .iter()
                                .map(|s| self.selected_sources.iter().any(|x| x == &s.value))
                                .collect::<Vec<bool>>();
                            for (index, checked) in indexes.iter_mut().enumerate() {
                                let item = &list[index];

                                ui.horizontal(|ui| {
                                    if ui.checkbox(checked, "").changed() {
                                        if *checked {
                                            self.selected_sources.push(item.value.clone());
                                        } else {
                                            self.selected_sources.retain(|x| x != &item.value);
                                        }
                                    }

                                    if ui
                                        .add(
                                            egui::Button::new(item.label.clone())
                                                .frame(false)
                                                .stroke(egui::Stroke::NONE)
                                                .fill(egui::Color32::TRANSPARENT),
                                        )
                                        .clicked()
                                    {
                                        if *checked {
                                            self.selected_sources.retain(|x| x != &item.value);
                                        } else {
                                            self.selected_sources.push(item.value.clone());
                                        }
                                    }

                                    if item.value.ends_with("aram")
                                        || item.value.starts_with("murderbridge")
                                    {
                                        ui.image(egui::include_image!("../../../assets/aram.png"))
                                            .on_hover_text("All Random All Mid");
                                    } else if item.value.ends_with("urf") {
                                        ui.image(egui::include_image!("../../../assets/urf.png"))
                                            .on_hover_text("Ultra Rapid Fire");
                                    } else {
                                        ui.image(egui::include_image!("../../../assets/sr.png"))
                                            .on_hover_text("Summoner's Rift");
                                    }
                                });
                            }
                        }
                        Some(Err(err)) => {
                            ui.label(format!("Failed to fetch sources: {:?}", err));
                        }
                    },
                    None => {
                        let promise =
                            Promise::spawn_async(async move { web::fetch_sources().await });
                        self.sources_promise = Some(promise);
                    }
                };
            });

            let lcu_auth = {
                let auth = self.lcu_auth.read().unwrap();
                auth.clone()
            };
            let is_running = !lcu_auth.token.is_empty();
            let is_tencent = lcu_auth.is_tencent;

            ui.add_space(8.);
            if ui
                .button("Apply Builds")
                .on_hover_text("Apply builds from selected sources")
                .clicked()
            {
                // TOOD: apply builds for selected sources
                log::info!("start applying builds");
            }

            ui.separator();
            ui.add_space(8.);

            if is_running {
                ui.horizontal(|ui| {
                    if is_tencent {
                        ui.image(egui::include_image!("../../../assets/tencent.png"))
                            .on_hover_text("Tencent server");
                        ui.label("Tencent League of Legends client detected.");
                    } else {
                        ui.image(egui::include_image!("../../../assets/riot.png"))
                            .on_hover_text("Riot server");
                        ui.label("Riot League of Legends client detected.");
                    }
                });

                #[cfg(debug_assertions)]
                {
                    let random_mode = self.random_mode.clone();
                    ui.horizontal(|ui| {
                        ui.label("Random mode");
                        toogle_ui::make_toggle(ui, &mut random_mode.lock().unwrap());
                    });
                }
            } else {
                ui.horizontal(|ui| {
                    ui.label("Is League client running?");
                    ui.image(egui::include_image!("../../../assets/emojis/1f914.svg"));
                });
            }
        });

        egui::TopBottomPanel::bottom("footer").show(ctx, |ui| {
            ui.add_space(8.);
            ui.vertical_centered(|ui| {
                ui.hyperlink("https://github.com/cangzhang/champ-r");
                ui.spacing();
                ui.horizontal_top(|ui| {
                    ui.label("If you like it, please star");
                    ui.add(
                        egui::Image::new(egui::include_image!("../../../assets/star.svg"))
                            .fit_to_exact_size(egui::vec2(16., 16.)),
                    );
                    ui.label("on GitHub");
                });
            });
            ui.add_space(8.);
        });
    }
}

pub fn setup_custom_fonts(ctx: &egui::Context) {
    // Start with the default fonts (we will be adding to them rather than replacing them).
    let mut fonts = egui::FontDefinitions::default();

    fonts.font_data.insert(
        "Inter-Regular".to_owned(),
        egui::FontData::from_static(include_bytes!("../../../assets/fonts/Inter-Regular.ttf")),
    );

    // Put font first (highest priority) for proportional text:
    fonts
        .families
        .entry(egui::FontFamily::Proportional)
        .or_default()
        .insert(0, "Inter-Regular".to_owned());

    // Tell egui to use these fonts:
    ctx.set_fonts(fonts);
}
