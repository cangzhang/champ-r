use eframe::egui;
use poll_promise::Promise;

use crate::{source::SourceItem, web};

#[cfg_attr(feature = "serde", derive(serde::Deserialize, serde::Serialize))]
#[derive(Default)]
pub struct MyApp {
    pub sources: Vec<SourceItem>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub sources_promise: Option<Promise<Result<Vec<SourceItem>, web::FetchError>>>,

    pub selected_sources: Vec<String>,
}

impl eframe::App for MyApp {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        let img_source = "https://picsum.photos/1024";

        egui::CentralPanel::default().show(ctx, |ui| {
            egui::ScrollArea::new([true, true]).show(ui, |ui| {
                if ui.button("Random").clicked() {
                    ctx.forget_image(img_source);
                    ctx.request_repaint();
                }

                ui.add(egui::Image::new(img_source).rounding(10.0));

                match &self.sources_promise {
                    Some(p) => match p.ready() {
                        None => {
                            ui.spinner();
                        }
                        Some(Ok(list)) => {
                            self.sources = list.clone();

                            let mut indexes = list.iter().map(|s| {
                                self.selected_sources.iter().any(|x| x == &s.value)
                            }).collect::<Vec<bool>>();
                            for (index, checked) in indexes.iter_mut().enumerate() {
                                let item = &list[index];

                                if ui.checkbox(checked, item.label.clone()).changed() && *checked {
                                    if *checked {
                                        self.selected_sources.retain(|x| x != &item.value);
                                    } else {
                                        self.selected_sources.push(item.value.clone());
                                    }
                                }
                            }
                        }
                        Some(Err(err)) => {
                            println!("Error: {:?}", err);
                        }
                    },
                    None => {
                        let promise =
                            Promise::spawn_async(async move { web::fetch_sources().await });
                        self.sources_promise = Some(promise);
                    }
                };
            });
        });
    }
}
