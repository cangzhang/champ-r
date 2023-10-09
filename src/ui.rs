use std::sync::{Arc, Mutex};

use eframe::{
    egui,
    epaint::{vec2, Stroke},
};
use poll_promise::Promise;

use crate::{cmd::CommandLineOutput, source::SourceItem, web};

#[cfg_attr(feature = "serde", derive(serde::Deserialize, serde::Serialize))]
#[derive(Default)]
pub struct MyApp {
    pub sources: Vec<SourceItem>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub sources_promise: Option<Promise<Result<Vec<SourceItem>, web::FetchError>>>,

    pub selected_sources: Vec<String>,
    pub auth: Arc<Mutex<CommandLineOutput>>,
}

impl MyApp {
    pub fn new(auth: Arc<Mutex<CommandLineOutput>>) -> Self {
        Self {
            auth,
            ..Default::default()
        }
    }
}

impl eframe::App for MyApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        let img_source = "https://picsum.photos/1024";
        let auth = self.auth.lock().unwrap();
        let is_tencent = auth.is_tencent;
        let is_running = !auth.token.is_empty();

        egui::CentralPanel::default().show(ctx, |ui| {
            egui::ScrollArea::new([true, true]).show(ui, |ui| {
                if ui.button("Random").clicked() {
                    ctx.forget_image(img_source);
                    ctx.request_repaint();
                }

                ui.add(
                    egui::Image::new(img_source)
                        .max_size(vec2(64., 64.))
                        .rounding(10.0),
                );

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
                                                .stroke(Stroke::NONE)
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

                                    if item.is_aram.unwrap_or_default() {
                                        ui.image(egui::include_image!("../assets/aram.png"))
                                            .on_hover_text("All Random All Mid");
                                    } else if item.is_urf.unwrap_or_default() {
                                        ui.image(egui::include_image!("../assets/urf.png"))
                                            .on_hover_text("Ultra Rapid Fire");
                                    } else {
                                        ui.image(egui::include_image!("../assets/sr.png"))
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

            if is_running {
                ui.separator();

                ui.horizontal(|ui| {
                    if is_tencent {
                        ui.image(egui::include_image!("../assets/tencent.png"))
                            .on_hover_text("Tencent server");
                        ui.label("Tencent League of Legends client detected.");
                    } else {
                        ui.image(egui::include_image!("../assets/riot.png"))
                            .on_hover_text("Riot server");
                        ui.label("Riot League of Legends client detected.");
                    }
                });
            }
        });
    }
}
