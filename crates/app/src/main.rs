#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use bytes::Bytes;
use kv_log_macro::{error, info};
use std::collections::HashMap;
use vizia::prelude::*;

use lcu::{api, builds, cmd, source, web};

#[derive(Lens, Default)]
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

pub enum AppEvent {
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
}

impl Model for AppData {
    fn event(&mut self, cx: &mut EventContext, event: &mut Event) {
        event.map(|window_event, _meta| {
            if let WindowEvent::WindowClose = window_event {
                // meta.consume();
            }

            if let WindowEvent::SetAlwaysOnTop(true) = window_event {
                // meta.consume();
            }
        });

        event.map(|app_event, _| match app_event {
            AppEvent::FetchedSources(sources) => {
                self.source_list = sources.clone();
                self.rune_source = self.source_list.first().unwrap().value.clone();
            }

            AppEvent::ToggleSource(source_id) => {
                if self.checked_sources.contains(source_id) {
                    self.checked_sources.retain(|id| id.ne(source_id));
                } else {
                    self.checked_sources.push(source_id.clone());
                }
            }

            AppEvent::UpdateLcuStatus(running) => {
                self.lcu_running = *running;

                if !running {
                    self.current_champion_id = 0;
                    self.lcu_auth_url = String::new();
                }
            }

            AppEvent::UpdateCurrentChampionId(champion_id) => {
                if *champion_id != self.current_champion_id {
                    self.current_champion_id = *champion_id;
                    self.show_rune_window = *champion_id > 0;
                    if *champion_id > 0 {
                        // cx.emit(WindowEvent::SetAlwaysOnTop(*champion_id > 0));
                        cx.emit(AppEvent::ReFetchRunes);
                    } else {
                        self.runes = vec![];
                        self.builds = vec![];
                    }
                }
            }

            AppEvent::ReFetchRunes => {
                let mut proxy = cx.get_proxy();
                if self.current_champion_id > 0 && !self.rune_source.is_empty() {
                    let rune_source = self.rune_source.clone();
                    let current_champion_id = self.current_champion_id;
                    tokio::spawn(async move {
                        let runes = web::list_builds_by_id(&rune_source, current_champion_id).await;
                        match runes {
                            Ok(runes) => {
                                info!(
                                    "Fetched runes for: {:?} {:?}",
                                    rune_source, current_champion_id
                                );
                                proxy
                                    .emit(AppEvent::UpdateBuilds(runes))
                                    .expect("Failed to emit event");
                            }
                            Err(err) => {
                                error!("Failed to fetch runes: {:?}", err);
                            }
                        }
                    });
                }
            }

            AppEvent::SetRuneImage(rune_image) => {
                self.rune_images
                    .insert(self.current_champion_id, rune_image.clone());
            }

            AppEvent::UpdateBuilds(builds) => {
                let runes: Vec<builds::Rune> = builds
                    .iter()
                    .flat_map(|build| build.runes.clone())
                    .collect();
                self.runes = runes.clone();

                self.builds = builds
                    .iter()
                    .flat_map(|build| build.item_builds.clone())
                    .collect();

                let mut proxy = cx.get_proxy();
                let perks = self.perks.clone();
                let auth_url = self.lcu_auth_url.clone();
                tokio::spawn(async move {
                    for rune in runes {
                        let r = perks.iter().find(|p| p.style_id == rune.primary_style_id);
                        if let Some(rune_perk) = r {
                            let img_url = format!("{}{}", auth_url, rune_perk.icon_path);
                            let rune_image = api::fetch_rune_image(&img_url).await;
                            match rune_image {
                                Ok(rune_image) => {
                                    let img_name = format!("rune_{}.png", rune_perk.style_id);
                                    proxy
                                        .load_image(
                                            img_name,
                                            rune_image.as_ref(),
                                            ImageRetentionPolicy::DropWhenUnusedForOneFrame,
                                        )
                                        .expect("Failed to load image");
                                }
                                Err(err) => {
                                    error!("Failed to fetch rune image: {:?}", err);
                                }
                            }
                        }
                    }
                });
            }

            AppEvent::SetPerks(perks) => {
                self.perks = perks.clone();
            }

            AppEvent::SetLcuAuthUrl(auth_url) => {
                if !self.lcu_auth_url.eq(auth_url) {
                    info!("LCU auth url changed to: {}", auth_url);
                    self.lcu_auth_url = auth_url.clone();
                }

                let mut proxy = cx.get_proxy();
                if self.perks.is_empty() && !self.lcu_auth_url.is_empty() {
                    let auth_url = auth_url.clone();
                    tokio::spawn(async move {
                        let perks = api::list_all_perks(&auth_url).await;
                        match perks {
                            Ok(perks) => {
                                info!("Fetched lcu perks: {:?}", perks.len());
                                proxy
                                    .emit(AppEvent::SetPerks(perks))
                                    .expect("Failed to emit event");
                            }
                            Err(err) => {
                                error!("Failed to fetch perks: {:?}", err);
                            }
                        }
                    });
                }
            }

            AppEvent::ToggleRuneWindow(show) => {
                self.show_rune_window = *show;
            }

            AppEvent::CloseRuneWindow => {
                self.show_rune_window = false;
            }

            AppEvent::SetRuneSource(source) => {
                self.rune_source = source.clone();
                // cx.emit(AppEvent::ReFetchRunes);
            }
        });
    }
}

#[tokio::main]
async fn main() -> Result<(), ApplicationError> {
    femme::with_level(femme::LevelFilter::Info);

    let app = Application::new(|cx| {
        cx.add_stylesheet(include_style!("src/style.css"))
            .expect("Failed to add stylesheet");

        AppData {
            tabs: vec!["Builds", "Settings"],
            ..Default::default()
        }
        .build(cx);

        TabView::new(cx, AppData::tabs, |cx, item| match item.get(cx) {
            "Builds" => TabPair::new(
                move |cx| {
                    Label::new(cx, item).class("tab-name").hoverable(false);
                },
                |cx| {
                    VStack::new(cx, |cx| {
                        ScrollView::new(cx, 0.0, 0.0, false, true, |cx| {
                            List::new(cx, AppData::source_list, |cx, _, source| {
                                let val = source.get(cx).value.clone();
                                let val2 = val.clone();
                                let checked = AppData::checked_sources
                                    .map(move |sources| sources.contains(&val));

                                let label = source.get(cx).label.clone().to_uppercase();
                                HStack::new(cx, |cx| {
                                    let v = val2.clone();
                                    Checkbox::new(cx, checked)
                                        .on_toggle(move |cx| {
                                            cx.emit(AppEvent::ToggleSource(v.clone()));
                                        })
                                        .id(val2.clone());
                                    Label::new(cx, label)
                                        .describing(val2.clone())
                                        .class("source-name");
                                })
                                .size(Auto)
                                .child_top(Pixels(4.))
                                .child_bottom(Pixels(4.))
                                .col_between(Pixels(8.));
                            })
                            .class("source-list");
                        })
                        .height(Stretch(1.))
                        .class("list-container");

                        Label::new(
                            cx,
                            AppData::lcu_running.map(|&running| {
                                if running {
                                    "LCU is running"
                                } else {
                                    "LCU is not running"
                                }
                            }),
                        );
                        HStack::new(cx, |cx| {
                            Label::new(
                                cx,
                                AppData::lcu_auth_url.map(|url| format!("🔑 Auth URL: {}", url)),
                            );
                        })
                        .text_align(TextAlign::Center)
                        .height(Auto)
                        .font_family(vec![FamilyOwned::Named(String::from("Courier New"))]);
                    })
                    .child_space(Pixels(16.0))
                    .height(Stretch(1.));
                },
            ),

            "Settings" => TabPair::new(
                move |cx| {
                    Label::new(cx, item).hoverable(false).class("tab-name");
                },
                |cx| {
                    ScrollView::new(cx, 0.0, 0.0, false, true, |cx| {
                        Label::new(cx, "Settings");
                    })
                    .class("widgets");
                },
            ),

            _ => TabPair::new(|_| {}, |_| {}),
        });

        Binding::new(cx, AppData::show_rune_window, |cx, show_subwindow| {
            if show_subwindow.get(cx) {
                Window::new(cx, |cx| {
                    VStack::new(cx, |cx| {
                        Label::new(cx, "Rune window");
                        Label::new(
                            cx,
                            AppData::current_champion_id.map(|id| format!("Champion ID: {}", id)),
                        );

                        Dropdown::new(
                            cx,
                            move |cx| {
                                Button::new(cx, |cx| Label::new(cx, AppData::rune_source))
                                    .on_press(|cx| cx.emit(PopupEvent::Switch));
                            },
                            move |cx| {
                                List::new(cx, AppData::source_list, |cx, _, item| {
                                    let label = item.get(cx).label.clone();
                                    let value = item.get(cx).value.clone();
                                    Label::new(cx, label)
                                        .cursor(CursorIcon::Hand)
                                        .bind(AppData::rune_source, move |handle, selected| {
                                            if item.get(&handle).value.eq(&selected.get(&handle)) {
                                                handle.checked(true);
                                            }
                                        })
                                        .on_press(move |cx| {
                                            cx.emit(AppEvent::SetRuneSource(value.clone()));
                                            cx.emit(PopupEvent::Close);
                                            cx.emit(AppEvent::ReFetchRunes);
                                        });
                                });
                            },
                        )
                        .top(Pixels(40.0))
                        .width(Pixels(100.0));

                        Binding::new(cx, AppData::runes, |cx, _| {
                            ScrollView::new(cx, 0.0, 0.0, false, true, |cx| {
                                List::new(cx, AppData::runes, |cx, _, rune| {
                                    Label::new(cx, rune.get(cx).name.clone());

                                    let primary_style_id = rune.get(cx).primary_style_id;
                                    let img_name = format!("rune_{}.png", primary_style_id);
                                    Image::new(cx, img_name);
                                });
                            });
                        });

                        Binding::new(cx, AppData::builds, |cx, _| {
                            ScrollView::new(cx, 0.0, 0.0, false, true, |cx| {
                                List::new(cx, AppData::builds, |cx, _, build| {
                                    Label::new(cx, build.get(cx).title.clone());
                                });
                            });
                        });
                    });
                })
                .on_close(|cx| {
                    cx.emit(AppEvent::CloseRuneWindow);
                })
                .always_on_top(true)
                .title("Runes")
                .inner_size((400, 500));
            }
        });
    })
    .title("ChampR")
    .inner_size((500, 400));

    let mut proxy = app.get_proxy();
    tokio::spawn(async move {
        let sources = web::fetch_sources().await;

        match sources {
            Ok(sources) => {
                proxy
                    .emit(AppEvent::FetchedSources(sources))
                    .expect("Failed to emit event");
            }
            Err(err) => {
                error!("Failed to fetch sources: {:?}", err);
            }
        }
    });

    let mut proxy = app.get_proxy();
    tokio::spawn(async move {
        let mut prev_cid: i64 = 0;
        let sleep_duration = Duration::from_millis(2500);

        loop {
            let cmd_output = cmd::get_commandline();
            if cmd_output.auth_url.is_empty() {
                proxy
                    .emit(AppEvent::UpdateLcuStatus(false))
                    .expect("Failed to emit event");
                tokio::time::sleep(sleep_duration).await;
                continue;
            }

            proxy
                .emit(AppEvent::UpdateLcuStatus(true))
                .expect("Failed to emit event");

            let auth_url = format!("https://{}", cmd_output.auth_url);
            proxy
                .emit(AppEvent::SetLcuAuthUrl(auth_url.clone()))
                .expect("Failed to emit event");
            if let Ok(champion_id) = api::get_session(&auth_url).await {
                let cid = champion_id.unwrap_or_default();
                if prev_cid != cid {
                    info!("champion id changed to: {}", cid);
                    prev_cid = cid;
                }

                proxy
                    .emit(AppEvent::UpdateCurrentChampionId(cid))
                    .expect("Failed to emit event");
            }

            tokio::time::sleep(sleep_duration).await;
        }
    });

    app.run()
}
