#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use kv_log_macro::{error, info};
use slint::{Model, Timer, VecModel};
use std::rc::Rc;

use lcu::web;

slint::include_modules!();

#[tokio::main]
async fn main() -> Result<(), slint::PlatformError> {
    femme::with_level(femme::LevelFilter::Info);

    let window = AppWindow::new()?;

    let weak_win = window.as_weak();
    tokio::spawn(async move {
        let sources = web::fetch_sources().await;
        match sources {
            Ok(sources) => {
                info!("fetched sources");
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
