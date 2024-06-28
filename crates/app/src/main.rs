#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use kv_log_macro::{error, info};
use slint::{Model, SharedString, VecModel};
use std::{rc::Rc, time::Duration};

use lcu::{api, cmd, web};

slint::include_modules!();

#[tokio::main]
async fn main() -> Result<(), slint::PlatformError> {
    femme::with_level(femme::LevelFilter::Info);

    slint::slint! {
        import { Button, VerticalBox, CheckBox, ComboBox } from "std-widgets.slint";

        // https://github.com/slint-ui/slint/discussions/4324
        export component ChangeObserver {
            in property <string> value;
            // first argument is new value; must return second argument
            pure callback changed(string, float) -> float;

            width: 0;
            height: 0;
            visible: false;

            opacity: changed(value, 1);
        }

        export component RuneWindow inherits Window {
            title: "Runes";
            width: 400px;
            height: 500px;
            always-on-top: root.on_top;

            in property <int> champion_id;
            in property <string> lcu_auth;
            in property <bool> on_top;
            in-out property <string> source;
            in property <[string]> source_list;

            pure callback refetch_data(string, string);

            VerticalBox {
                spacing: 8px;

                Text {
                    height: 20px;
                    text: root.champion_id;
                }

                combo := ComboBox {
                    width: self.preferred-width;
                    height: self.preferred-height;
                    model: root.source_list;
                    current-index: 0;
                    current-value: root.source;
                }

                // ChangeObserver {
                //     value: root.champion_id;
                //     changed => {
                //         root.refetch_data(root.champion_id, combo.current-value);
                //         0.
                //     }
                // }
                ChangeObserver {
                    value: root.champion_id + combo.current-value;
                    changed => {
                        root.refetch_data(root.champion_id, combo.current-value);
                        0.
                    }
                }
            }
        }
    }

    let window = AppWindow::new()?;
    let rune_window = RuneWindow::new()?;

    let _weak_rune_win = rune_window.as_weak();
    rune_window.on_refetch_data(move |cid, source| {
        if source.is_empty() {
            return;
        }

        info!("[rune_window] refetch data for {}, {}", cid, source);
        tokio::spawn(async move {
            let champion_id: i64 = cid.to_string().parse().unwrap_or_default();
            let runes = web::list_builds_by_id(&source.to_string(), champion_id).await;
            match runes {
                Ok(runes) => {
                    info!("[rune_window]: fetched runes {:?}", runes);
                }
                Err(err) => {
                    error!("[rune_window]: failed to fetch runes: {:?}", err);
                }
            };
        });
    });

    let weak_win = window.as_weak();
    let weak_rune_win = rune_window.as_weak();
    tokio::spawn(async move {
        let sources = web::fetch_sources().await;
        match sources {
            Ok(sources) => {
                info!("fetched source list");

                let list = sources
                    .iter()
                    .map(|s| UiSource {
                        name: s.label.clone().into(),
                        source: s.value.clone().into(),
                        checked: false,
                    })
                    .collect::<Vec<UiSource>>();

                weak_win
                    .upgrade_in_event_loop(move |window| {
                        let ui_list = Rc::new(VecModel::from(list));
                        window.set_source_list(ui_list.into());
                        info!("updated sources");
                    })
                    .unwrap();

                let list = sources
                    .iter()
                    .map(|s| s.value.clone().into())
                    .collect::<Vec<SharedString>>();
                weak_rune_win
                    .upgrade_in_event_loop(move |rune_win| {
                        let ui_list = Rc::new(VecModel::from(list));
                        rune_win.set_source_list(ui_list.into());
                        info!("rune_window: updated sources");
                    })
                    .unwrap();
            }
            Err(err) => {
                error!("Failed to fetch sources: {:?}", err);
            }
        }
    });

    let weak_win = window.as_weak();
    let weak_rune_window = rune_window.as_weak();
    tokio::spawn(async move {
        let mut prev_cid: i64 = 0;

        loop {
            let cmd_output = cmd::get_commandline();
            if cmd_output.auth_url.is_empty() {
                weak_win
                    .upgrade_in_event_loop(move |window| {
                        window.set_lcu_running(false);
                    })
                    .unwrap();

                tokio::time::sleep(Duration::from_millis(2500)).await;
                continue;
            }

            let auth_url = format!("https://{}", cmd_output.auth_url);
            if let Ok(champion_id) = api::get_session(&auth_url).await {
                let cid = if champion_id.is_some() {
                    champion_id.clone().unwrap()
                } else {
                    0
                };
                if prev_cid != cid {
                    info!("rune_window: champion id changed to: {}", cid);
                    prev_cid = cid;
                    weak_rune_window
                        .upgrade_in_event_loop(move |rune_window| {
                            if cid > 0 {
                                rune_window.set_champion_id(cid.try_into().unwrap());
                                let _ = rune_window.show();
                                let _ = rune_window.set_on_top(true);
                                info!("rune_window: got champion id: {}", cid);
                            } else {
                                // rune_window.set_champion("No champion selected".into());
                                let _ = rune_window.set_on_top(false);
                                // info!("rune_window: no champion selected");
                            }
                        })
                        .unwrap();
                }
            }

            weak_win
                .upgrade_in_event_loop(move |window| {
                    window.set_lcu_running(true);
                })
                .unwrap();
            weak_rune_window
                .upgrade_in_event_loop(move |rune_window| {
                    rune_window.set_lcu_auth(cmd_output.auth_url.clone().into());
                })
                .unwrap();
            tokio::time::sleep(Duration::from_millis(2500)).await;
        }
    });

    let weak_win = window.as_weak();
    window.on_apply_builds(move || {
        let win = weak_win.unwrap();
        let selected = win
            .get_source_list()
            .iter()
            .filter(|s| s.checked)
            .map(|s| s.source.into())
            .collect::<Vec<String>>();
        info!("Selected sources: {:?}", selected);
    });

    window.run()
}
