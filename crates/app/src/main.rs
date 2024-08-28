#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::fmt::format;

use kv_log_macro::{error, info};
use lcu::{api, cmd, source, web};
use vizia::prelude::*;

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
                if self.checked_sources.contains(&source_id) {
                    self.checked_sources.retain(|id| id.ne(source_id));
                } else {
                    self.checked_sources.push(source_id.clone());
                }
            }

            AppEvent::UpdateLcuStatus(running) => {
                self.lcu_running = running.clone();

                if !running {
                    self.current_champion_id = 0;
                    self.lcu_auth_url = String::new();
                }
            }

            AppEvent::UpdateCurrentChampionId(champion_id) => {
                self.current_champion_id = champion_id.clone();
                // cx.emit(WindowEvent::SetAlwaysOnTop(*champion_id > 0));
                self.show_rune_window = *champion_id > 0;
            }

            AppEvent::SetLcuAuthUrl(auth_url) => {
                self.lcu_auth_url = auth_url.clone();
            }

            AppEvent::ToggleRuneWindow(show) => {
                self.show_rune_window = show.clone();
            }

            AppEvent::CloseRuneWindow => {
                self.show_rune_window = false;
            }

            AppEvent::SetRuneSource(source) => {
                self.rune_source = source.clone();
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
                    Label::new(cx, item)
                        .hoverable(false)
                        .class("tab-name");
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
                                        });
                                });
                            },
                        )
                        .top(Pixels(40.0))
                        .width(Pixels(100.0));
                    });
                })
                .on_close(|cx| {
                    cx.emit(AppEvent::CloseRuneWindow);
                })
                .always_on_top(true)
                .title("Runes")
                .inner_size((400, 200))
                .position((500, 100));
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
                let cid = if champion_id.is_some() {
                    champion_id.unwrap()
                } else {
                    0
                };
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
