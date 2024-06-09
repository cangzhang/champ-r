#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use kv_log_macro::{error, info};
use slint::{Model, VecModel};
use std::{rc::Rc, time::Duration};

use lcu::{api, cmd, web};

slint::include_modules!();

#[tokio::main]
async fn main() -> Result<(), slint::PlatformError> {
    femme::with_level(femme::LevelFilter::Info);

    slint::slint! {
        import { Button, VerticalBox, CheckBox } from "std-widgets.slint";

        export component RuneWindow inherits Window {
            title: "Runes";
            width: 400px;
            height: 500px;

            in property <string> champion;
            in property <string> lcu_auth;

            VerticalBox {
                Text {
                    text: root.champion;
                }
                Text {
                    text: root.lcu_auth;
                }
            }
        }
    }

    let window = AppWindow::new()?;
    let rune_window = RuneWindow::new()?;

    let weak_win = window.as_weak();
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
                if champion_id.is_some() {
                    weak_rune_window
                        .upgrade_in_event_loop(move |rune_window| {
                            rune_window.set_champion(champion_id.unwrap().to_string().into());
                            let _ = rune_window.run();
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
