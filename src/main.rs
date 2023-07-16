#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

pub mod builds;
pub mod cmd;
pub mod config;
pub mod fonts;
pub mod lcu;
pub mod source;
pub mod styles;
pub mod ui;
pub mod util;
pub mod web;

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use builds::Rune;
use bytes::Bytes;
use iced::widget::{
    button, checkbox, column, image, pick_list, row, scrollable, text, tooltip, Column, Container,
};
use iced::window::{PlatformSpecific, Position};
use iced::{alignment, theme};
use iced::{executor, window, Alignment, Padding, Subscription};
use iced::{Application, Command, Element, Length, Settings, Theme};
use iced_native::Event;

use tracing::info;
use tracing_appender::rolling::{RollingFileAppender, Rotation};
use tracing_subscriber::FmtSubscriber;

use lcu::api::{apply_rune, LcuError};
use lcu::client::LcuClient;
use source::SourceItem;
use ui::{ChampR, LogItem};
use web::{ChampionsMap, DataDragonRune, FetchError};

pub fn main() -> iced::Result {
    let file_appender = RollingFileAppender::new(
        Rotation::DAILY,
        "logs", // Directory where log files are stored
        "log",  // Log file name prefix
    );
    // Create a non-blocking writer
    let (non_blocking, _guard) = tracing_appender::non_blocking(file_appender);
    // Set up a subscriber with the file appender
    #[allow(unused_variables)]
    let subscriber = FmtSubscriber::builder().with_writer(non_blocking).finish();
    // Set the global subscriber
    #[cfg(not(debug_assertions))]
    tracing::subscriber::set_global_default(subscriber)
        .expect("Failed to set global tracing subscriber");

    #[cfg(debug_assertions)]
    tracing_subscriber::fmt::init();

    let conf = config::read_and_init();
    let app_config1 = Arc::new(Mutex::new(conf));
    let app_config2 = app_config1.clone();

    let champions_map1: Arc<Mutex<ChampionsMap>> = Arc::new(Mutex::new(HashMap::new()));
    let champions_map2 = champions_map1.clone();
    let remote_rune_list1 = Arc::new(Mutex::new(Vec::<DataDragonRune>::new()));
    let remote_rune_list2 = remote_rune_list1.clone();
    let fetched_remote_data1 = Arc::new(Mutex::new(false));
    let fetched_remote_data2 = fetched_remote_data1.clone();

    // lcu auth
    let auth_url1 = Arc::new(Mutex::new(String::new()));
    let auth_url2 = auth_url1.clone();
    let is_tencent1 = Arc::new(Mutex::new(false));
    let is_tencent2 = is_tencent1.clone();
    let lcu_dir1 = Arc::new(Mutex::new(String::new()));
    let lcu_dir2 = lcu_dir1.clone();

    // lcu session
    let current_champion_id1 = Arc::new(Mutex::new(None));
    let current_champion_id2 = current_champion_id1.clone();
    let current_champion1 = Arc::new(Mutex::new(String::new()));
    let current_champion2 = current_champion1.clone();
    let current_champion_runes1: Arc<Mutex<Vec<Rune>>> = Arc::new(Mutex::new(vec![]));
    let current_champion_runes2 = current_champion_runes1.clone();
    let loading_runes1 = Arc::new(Mutex::new(false));
    let loading_runes2 = loading_runes1.clone();
    let current_champion_avatar1 = Arc::new(Mutex::new(None));
    let current_champion_avatar2 = current_champion_avatar1.clone();
    let rune_images1 = Arc::new(Mutex::new(Vec::<(Bytes, Bytes, Bytes)>::new()));
    let rune_images2 = rune_images1.clone();

    let apply_builds_logs1 = Arc::new(Mutex::new(Vec::<LogItem>::new()));
    // let apply_builds_logs2 = apply_builds_logs1.clone();

    let rt = tokio::runtime::Runtime::new().unwrap();
    rt.block_on(async move {
        tokio::spawn(async move {
            let mut lcu_client = LcuClient::new(
                auth_url2,
                is_tencent2,
                lcu_dir2,
                current_champion_id2,
                current_champion2,
                champions_map2,
                current_champion_runes2,
                app_config2,
                loading_runes2,
                current_champion_avatar2,
                fetched_remote_data2,
                remote_rune_list2,
                rune_images2,
            );
            lcu_client.start().await;
        });
    });

    let window_icon = util::load_icon();
    ChampR::run(Settings {
        id: None,
        window: window::Settings {
            size: (600, 500),
            min_size: Some((600, 500)),
            position: Position::Centered,
            max_size: None,
            visible: true,
            resizable: true,
            decorations: true,
            transparent: false,
            always_on_top: false,
            icon: Some(window_icon),
            platform_specific: PlatformSpecific::default(),
        },
        default_font: Some(fonts::SARSA_MONO_REGULAR_BYTES),
        default_text_size: 18.,
        text_multithreading: true,
        antialiasing: false,
        exit_on_close_request: false,
        try_opengles_first: false,
        flags: ChampR::new(
            auth_url1,
            is_tencent1,
            lcu_dir1,
            apply_builds_logs1,
            current_champion_id1,
            champions_map1,
            current_champion1,
            current_champion_runes1,
            app_config1,
            loading_runes1,
            current_champion_avatar1,
            fetched_remote_data1,
            remote_rune_list1,
            rune_images1,
        ),
    })
}

#[derive(Debug, Clone)]
pub enum Message {
    InitRemoteData(Result<(Vec<SourceItem>, ChampionsMap, Vec<DataDragonRune>), FetchError>),
    UpdateSelected(String),
    ApplyBuilds,
    TickRun,
    ApplyBuildsDone(Result<(), ()>),
    ApplyRune(String, Rune),
    ApplyRuneDone(Result<(), LcuError>),
    OnSelectRuneSource(String),
    OnFetchedRunes(Result<Vec<Rune>, FetchError>),
    EventOccurred(iced_native::Event),
}

impl Application for ChampR {
    type Executor = executor::Default;
    type Message = Message;
    type Theme = Theme;
    type Flags = ChampR;

    fn new(flags: ChampR) -> (Self, Command<Message>) {
        (
            flags,
            Command::perform(web::init_for_ui(), Message::InitRemoteData),
        )
    }

    fn title(&self) -> String {
        String::from("ChampR - Builds, Runes, All in One. v2.0.2-b7")
    }

    fn update(&mut self, message: Message) -> Command<Message> {
        match message {
            Message::InitRemoteData(resp) => {
                if let Ok((sources, champions_map, remote_runes)) = resp {
                    *self.source_list.lock().unwrap() = sources;
                    *self.champions_map.lock().unwrap() = champions_map;
                    *self.remote_rune_list.lock().unwrap() = remote_runes;

                    *self.fetched_remote_data.lock().unwrap() = true;
                }
            }
            Message::UpdateSelected(s) => {
                let mut app_config = self.app_config.lock().unwrap();
                app_config.update_select_sources(s);
            }
            Message::ApplyBuilds => {
                let disconnected = self.auth_url.lock().unwrap().is_empty();
                let data_ready = *self.fetched_remote_data.lock().unwrap();
                let applying = self.applying_builds;

                let app_config = self.app_config.lock().unwrap();
                let has_nothing_selected = app_config.selected_sources.is_empty();

                info!("disconnected: {disconnected}, data_ready: {data_ready}, has_nothing_selected: {has_nothing_selected}, applying: {applying}");
                if disconnected || !data_ready || has_nothing_selected || applying {
                    return Command::none();
                }

                info!("Apply builds start");
                let logs = self.logs.clone();
                let lcu_dir = { self.lcu_dir.lock().unwrap().clone() };
                let champions_map = { self.champions_map.lock().unwrap().clone() };

                self.applying_builds = true;
                let is_tencent = self.is_tencent.lock().unwrap();
                return Command::perform(
                    builds::batch_apply(
                        app_config.selected_sources.clone(),
                        champions_map,
                        lcu_dir,
                        *is_tencent,
                        logs,
                    ),
                    Message::ApplyBuildsDone,
                );
            }
            Message::ApplyBuildsDone(resp) => {
                if resp.is_ok() {
                    info!("Apply builds done: {:?}", self.logs);
                }
                self.applying_builds = false;
            }
            Message::ApplyRune(auth_url, rune) => {
                return Command::perform(apply_rune(auth_url, rune), Message::ApplyRuneDone);
            }
            Message::ApplyRuneDone(resp) => {
                if let Err(e) = resp {
                    info!("ApplyRuneError: {:?}", e);
                }
            }
            Message::OnSelectRuneSource(source) => {
                let mut app_config = self.app_config.lock().unwrap();
                app_config.set_rune_source(source.clone());

                let current_champion = self.current_champion.lock().unwrap();
                if current_champion.len() > 0 {
                    *self.loading_runes.lock().unwrap() = true;
                    return Command::perform(
                        web::fetch_champion_runes(source, current_champion.clone()),
                        Message::OnFetchedRunes,
                    );
                }
            }
            Message::OnFetchedRunes(resp) => {
                *self.loading_runes.lock().unwrap() = false;
                if let Ok(runes) = resp {
                    *self.current_champion_runes.lock().unwrap() = runes;
                }
            }
            Message::EventOccurred(event) => {
                if let Event::Window(window::Event::CloseRequested) = event {
                    std::process::exit(0);
                }
            }
            Message::TickRun => {}
        }
        Command::none()
    }

    fn view(&self) -> Element<Message> {
        let sources = self.source_list.lock().unwrap();
        let champions_map = self.champions_map.lock().unwrap();

        let auth_url = self.auth_url.lock().unwrap();
        let lol_running = !auth_url.is_empty();

        // let current_champion = self.current_champion.lock().unwrap();
        let runes = self.current_champion_runes.lock().unwrap();
        let loading_runes = self.loading_runes.lock().unwrap();
        let avatar_guard = self.current_champion_avatar.lock().unwrap();
        let rune_images = self.rune_images.lock().unwrap();

        let app_config = self.app_config.lock().unwrap();
        let current_rune_source = app_config.rune_source.clone();
        let selected = app_config.selected_sources.clone();

        let mut source_list_col = Column::new().width(Length::Fill).spacing(8.).padding(16.);
        for item in sources.iter() {
            let label = item.label.clone();
            let value = item.value.clone();
            let checked = selected.contains(&value);

            let cbox = checkbox(label, checked, move |_checked| {
                Message::UpdateSelected(value.clone())
            })
            .text_size(20.)
            .spacing(6.);
            let icon = SourceItem::get_mode_icon(item);
            source_list_col = source_list_col.push(
                row![
                    cbox,
                    row![image(image::Handle::from_memory(icon))
                        .height(16.)
                        .width(16.)]
                ]
                .spacing(8.)
                .align_items(Alignment::Center),
            );
        }

        let mut rune_list_col = column!()
            // .height(Length::Fill)
            .width(Length::Fill)
            .spacing(8.);

        if *loading_runes {
            rune_list_col = rune_list_col
                .push(text("Loading runes...").horizontal_alignment(alignment::Horizontal::Center))
                .height(Length::Fill);
        } else {
            for (idx, r) in runes.iter().enumerate() {
                let rune_preview_row =
                    if let Some((primary_img, sub_img, first_img)) = rune_images.get(idx) {
                        row![
                            image(image::Handle::from_memory(primary_img.clone()))
                                .height(28.)
                                .width(28.),
                            image(image::Handle::from_memory(first_img.clone()))
                                .height(36.)
                                .width(36.),
                            image(image::Handle::from_memory(sub_img.clone()))
                                .height(26.)
                                .width(26.),
                        ]
                        .align_items(Alignment::Center)
                    } else {
                        row!()
                    };
                let rune_title = format!(
                    "Position: {}, Pick: {}, Win: {}",
                    r.position, r.pick_count, r.win_rate
                );
                let row = row![
                    column![
                        text(rune_title).size(14.).width(Length::FillPortion(2)),
                        rune_preview_row,
                    ]
                    .width(Length::FillPortion(2)),
                    row![button("Apply").on_press(Message::ApplyRune(auth_url.clone(), r.clone()))]
                        .align_items(Alignment::End)
                        .width(Length::FillPortion(1)),
                ]
                .align_items(Alignment::Center)
                .height(Length::Fixed(60.));
                rune_list_col = rune_list_col.push(row);
            }
        }

        let avatar_row = if let Some(b) = avatar_guard.clone() {
            let handle = image::Handle::from_memory(b);
            row!(image(handle).height(36.).width(36.))
        } else {
            row!().height(36.)
        };

        let main_row = row![
            column![
                row![text("Sources of Builds")
                    .size(22.)
                    .font(fonts::SARSA_MONO_BOLD)]
                .padding(Padding::from([0, 0, 0, 16])),
                scrollable(source_list_col)
                    .height(Length::Fill)
                    .width(Length::Fill)
            ]
            .padding(Padding::from([16, 0]))
            .height(Length::Fill)
            .width(Length::FillPortion(2)),
            column![
                row!(
                    pick_list(
                        sources
                            .iter()
                            .map(|s| s.value.clone())
                            .collect::<Vec<String>>(),
                        Some(current_rune_source),
                        Message::OnSelectRuneSource,
                    ),
                    avatar_row.padding(Padding::from([0, 8, 0, 0])),
                )
                .align_items(Alignment::Center)
                .spacing(16.)
                .padding(Padding::from([0, 0, 16, 0])),
                // .height(Length::FillPortion(1)),
                scrollable(rune_list_col)
                    .width(Length::Fill)
                    .height(Length::Fill)
            ]
            .padding(Padding::from([8, 16, 8, 0]))
            .width(Length::FillPortion(2))
            .height(Length::Fill)
        ]
        .spacing(8)
        .width(Length::Fill)
        .height(Length::FillPortion(2));

        let remote_data_info = if *self.fetched_remote_data.lock().unwrap() {
            text(format!(
                "Fetched: Available sources {:?}, Champions {:?}",
                sources.len(),
                champions_map.len()
            ))
        } else {
            text("Loading...")
        };

        let import_builds_info_text = if self.applying_builds {
            "Applying builds..."
        } else {
            ""
        };

        let apply_btn = button(
            text(fonts::IconChar::Rocket.as_str())
                .font(fonts::ICON_FONT)
                .horizontal_alignment(alignment::Horizontal::Center)
                .vertical_alignment(alignment::Vertical::Center),
        )
        .on_press(Message::ApplyBuilds)
        .padding(8.)
        .width(Length::Fixed(80.))
        .style(theme::Button::Custom(Box::new(
            styles::button::CustomIconButtonStyle,
        )));

        let btn_with_tooltip = row![tooltip(apply_btn, "Apply Builds!", tooltip::Position::Top)
            .gap(5)
            .style(theme::Container::Box)];

        let lcu_connect_info = if lol_running {
            "Connected to League of Legends.".to_string()
        } else {
            "Disconnected.".to_string()
        };
        let bot_col = column![
            remote_data_info,
            text(lcu_connect_info),
            row!(import_builds_info_text).height(Length::Fixed(20.)),
            btn_with_tooltip
        ]
        .spacing(8)
        .padding(8.)
        .width(Length::Fill)
        .height(Length::FillPortion(1))
        .align_items(Alignment::Center);
        let content = Column::new().push(main_row).push(bot_col);

        Container::new(content)
            .width(Length::Fill)
            .height(Length::Fill)
            .into()
    }

    fn subscription(&self) -> Subscription<Message> {
        let time_subscription =
            iced::time::every(Duration::from_millis(100)).map(|_| Message::TickRun);

        let ev_subscription = iced_native::subscription::events().map(Message::EventOccurred);

        Subscription::batch([time_subscription, ev_subscription])
    }
}
