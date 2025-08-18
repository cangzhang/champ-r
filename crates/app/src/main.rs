#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{collections::HashSet, time::Duration};
use freya::prelude::*;
use futures_util::{SinkExt, StreamExt, TryStreamExt};
use kv_log_macro::{self as log, info};

use lcu::{api::{make_sub_msg, make_ws_client}, cmd::get_cmd_output, source::SourceItem, web::fetch_sources};

fn main() {
    femme::with_level(femme::LevelFilter::Trace);
    launch_cfg(
        LaunchConfig::new()
            .with_window(WindowConfig::new(app).with_title("Sources - ChampR")),
    )
}

#[derive(Clone, Debug)]
enum SourceListStatus {
    Loading,
    Success,
    Error,
}

fn app() -> Element {
    let platform = use_platform();

    let onpress = move |_| {
        platform.new_window(
            WindowConfig::new_with_props(another_window, another_windowProps { value: 123 })
                .with_title("Another window"),
        )
    };

    let mut source_list = use_signal::<Vec<SourceItem>>(|| vec![]);
    let mut source_list_status = use_signal::<SourceListStatus>(|| SourceListStatus::Loading);
    use_effect(move || {
        spawn(async move {
            if let Ok(sources) = fetch_sources().await {
                source_list.write().extend(sources);
                *source_list_status.write() = SourceListStatus::Success;
            } else {
                *source_list_status.write() = SourceListStatus::Error;
            }
        });
    });

    let mut lcu_auth_url = use_signal(|| String::new());
    use_effect(move || {
        spawn(async move {
            loop {
                let url = lcu_auth_url.read().clone();
                if let Ok(ret) = get_cmd_output() {
                    if !url.eq(&ret.auth_url) {
                        lcu_auth_url.write().clear();
                        *lcu_auth_url.write() = ret.auth_url.clone();
                    }
                } else {
                    info!("error getting auth url output");
                }
                tokio::time::sleep(Duration::from_millis(2500)).await;
            }
        });
    });
    use_effect(move || {
        let endpoint = lcu_auth_url.read().clone();
        info!("[ws] {endpoint}");
        if endpoint.is_empty() {
            return;
        }
        spawn(async move {
            let ws = make_ws_client(&endpoint).await;
            if let Ok(ws) = ws {
                let (mut tx, mut rx) = ws.split();
                if let Err(e) = tx.send(make_sub_msg()).await {
                    info!("error sending message: {}", e);
                }
                loop {
                    while let Some(msg) = rx.next().await {
                        match msg {
                            Ok(msg) => {
                                info!("received: {:?}", msg);
                            }
                            Err(e) => {
                                info!("error receiving message: {}", e);
                                return;
                            }
                        }
                    }
                }
            }
           if let Err(e) = ws {
                info!("error creating websocket client: {}", e);
            }
        });
    });

    let mut selected = use_signal::<HashSet<String>>(HashSet::default);

    rsx!(
        rect {
            width: "fill",
            text_align: "center",
            font_size: "48",
            font_weight: "bold",
            // border: "2 inner black",
            main_align: "center",
            cross_align: "center",
            label { "ChampR" }
        }
        rect {
            width: "100%",
            {
                let status = source_list_status.read().clone();
                match &status {
                    SourceListStatus::Loading => {
                        rsx!(
                            rect {
                                label { "Loading..." }
                            }
                        )
                    }
                    SourceListStatus::Success => {
                        rsx!(
                            for source in source_list.read().clone() {
                                {
                                    let val = source.value.clone();
                                    let sv = val.clone();
                                    rsx!(
                                        Tile {
                                            onselect: move |_| {
                                                if selected.read().contains(&val) {
                                                    selected.write().remove(&val);
                                                } else {
                                                    selected.write().insert(val.clone());
                                                }
                                            },
                                            leading: rsx!(
                                                Checkbox {
                                                    selected: selected.read().contains(&sv),
                                                }
                                            ),
                                            label { "{source.label}" }
                                        }
                                    )
                                }
                            }
                        )
                    }
                    SourceListStatus::Error => {
                        rsx!(
                            rect {
                                label { "Got Error when loading source list" }
                            }
                        )
                    }
                }
            }
        }
        rect {
            width: "100%",
            main_align: "center",
            cross_align: "center",
            background: "white",
            color: "white",
            Button {
                onpress,
                label { "New window" }
            }
        }
        {
            let auth_url = lcu_auth_url.read().clone();
            if !auth_url.is_empty() {
                rsx!(
                    rect {
                        font_size: "12",
                        font_family: "Consolas, Menlo",
                        // font_family: "monospace",
                        label {
                            "Auth URL: {auth_url}"
                        }
                    }
                )
            } else {
                rsx!(
                    rect {}
                )
            }
        }
    )
}

#[component]
fn another_window(value: i32) -> Element {
    let platform = use_platform();

    let onpress = move |_| platform.close_window();

    rsx!(
        rect {
            height: "100%",
            width: "100%",
            main_align: "center",
            cross_align: "center",
            background: "white",
            font_size: "30",
            label {
                "Value: {value}"
            }
            Button {
                onpress,
                label { "Close" }
            }
        }
    )
}
