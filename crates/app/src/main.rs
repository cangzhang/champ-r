#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use kv_log_macro::{error, info};
use lcu::{api, cmd, source, web};
use vizia::prelude::*;

const STYLE: &str = r#"

    .modal {
        space: 1s;
        child-space: 8px;
        child-left: 1s;
        child-right: 1s;
        background-color: white;
        border-radius: 3px;
        border-width: 1px;
        border-color: #999999;
        outer-shadow: 0 3 10 #00000055;
        overflow: visible;
        child-space: 10px;
        height: auto;
    }

    .modal>vstack>label {
        width: auto;
        height: auto;
        space: 5px;
        child-space: 1s;
    }

    .modal button {
        border-radius: 3px;
        child-space: 1s;
    }

    .modal hstack {
        col-between: 20px;
        size: auto;
    }
"#;

#[derive(Lens, Default)]
pub struct AppData {
    is_saved: bool,
    show_dialog: bool,
    source_list: Vec<source::SourceItem>,
    checked_sources: Vec<String>,
    lcu_running: bool,
    current_champion_id: i64,
}

impl Model for AppData {
    fn event(&mut self, cx: &mut EventContext, event: &mut Event) {
        event.map(|window_event, meta| {
            // Intercept WindowClose event to show a dialog if not 'saved'.
            if let WindowEvent::WindowClose = window_event {
                if !self.is_saved {
                    self.show_dialog = true;
                    meta.consume();
                }
            }
        });

        event.map(|app_event, _| match app_event {
            AppEvent::HideModal => {
                self.show_dialog = false;
            }

            AppEvent::Save => {
                self.is_saved = true;
            }

            AppEvent::SaveAndClose => {
                self.is_saved = true;
                cx.emit(WindowEvent::WindowClose);
            }

            AppEvent::Cancel => {
                self.is_saved = false;
            }

            AppEvent::FetchedSources(sources) => {
                self.source_list = sources.clone();
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
                }
            }

            AppEvent::UpdateCurrentChampionId(champion_id) => {
                self.current_champion_id = champion_id.clone();
            }
        });
    }
}

pub enum AppEvent {
    HideModal,
    Save,
    SaveAndClose,
    Cancel,
    FetchedSources(Vec<source::SourceItem>),
    ToggleSource(String),
    UpdateLcuStatus(bool),
    UpdateCurrentChampionId(i64),
}

#[tokio::main]
async fn main() -> Result<(), ApplicationError> {
    femme::with_level(femme::LevelFilter::Info);

    let app = Application::new(|cx| {
        cx.add_stylesheet(STYLE).expect("Failed to add stylesheet");
        AppData {
            is_saved: false,
            show_dialog: false,
            ..Default::default()
        }
        .build(cx);

        VStack::new(cx, |cx| {
            ScrollView::new(cx, 0.0, 0.0, false, true, |cx| {
                List::new(cx, AppData::source_list, |cx, _, source| {
                    let val = source.get(cx).value.clone();
                    let val2 = val.clone();
                    let checked =
                        AppData::checked_sources.map(move |sources| sources.contains(&val));

                    FormControl::new(
                        cx,
                        move |cx| {
                            let val2 = val2.clone();
                            Checkbox::new(cx, checked).on_toggle(move |cx| {
                                cx.emit(AppEvent::ToggleSource(val2.clone()));
                            })
                        },
                        &source.get(cx).label,
                    );
                });
            })
            .height(Stretch(1.))
            .class("source-list");

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
        })
        .height(Stretch(1.));
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
            info!("rune_window: auth url: {}", cmd_output.auth_url);

            let auth_url = format!("https://{}", cmd_output.auth_url);
            if let Ok(champion_id) = api::get_session(&auth_url).await {
                let cid = if champion_id.is_some() {
                    champion_id.unwrap()
                } else {
                    0
                };
                if prev_cid != cid {
                    info!("rune_window: champion id changed to: {}", cid);
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
