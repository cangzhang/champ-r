pub mod builds;
pub mod cmd;
pub mod fonts;
pub mod lcu;
pub mod source;
pub mod ui;
pub mod web;

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use builds::Rune;
use bytes::Bytes;
use iced::alignment;
use iced::widget::{
    button, checkbox, column, image, pick_list, row, text, tooltip, Column, Container, Scrollable,
};
use iced::window::{PlatformSpecific, Position};
use iced::{executor, window, Alignment, Padding, Subscription};
use iced::{Application, Command, Element, Length, Settings, Theme};

use lcu::api::{apply_rune, LcuError};
use lcu::client::LcuClient;
use source::SourceItem;
use ui::{ChampR, LogItem};
use web::{ChampionsMap, DataDragonRune, FetchError};

pub fn main() -> iced::Result {
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
    let current_source1 = Arc::new(Mutex::new(String::from("op.gg")));
    let current_source2 = current_source1.clone();
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
                current_source2,
                loading_runes2,
                current_champion_avatar2,
                fetched_remote_data2,
                remote_rune_list2,
                rune_images2,
            );
            lcu_client.start().await;
        });
    });

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
            icon: None,
            platform_specific: PlatformSpecific::default(),
        },
        default_font: Some(fonts::SARSA_MONO_REGULAR_BYTES),
        default_text_size: 18.,
        text_multithreading: true,
        antialiasing: false,
        exit_on_close_request: true,
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
            current_source1,
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
        String::from("ChampR - Builds, Runes, All in One. v2.0.2-b2")
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
                let mut selected = self.selected_sources.lock().unwrap();
                if !selected.contains(&s) {
                    selected.push(s);
                } else {
                    let index = selected.iter().position(|x| *x == s).unwrap();
                    selected.remove(index);
                }
            }
            Message::ApplyBuilds => {
                if !(*self.auth_url.lock().unwrap()).is_empty() {
                    return Command::none();
                }

                let logs = self.logs.clone();
                let lcu_dir = { self.lcu_dir.lock().unwrap().clone() };
                let selected_sources = { self.selected_sources.lock().unwrap().clone() };
                let champions_map = { self.champions_map.lock().unwrap().clone() };

                return Command::perform(
                    builds::batch_apply(selected_sources, champions_map, lcu_dir, logs),
                    Message::ApplyBuildsDone,
                );
            }
            Message::ApplyBuildsDone(resp) => {
                if resp.is_ok() {
                    println!("Done: {:?}", self.logs);
                }
            }
            Message::ApplyRune(auth_url, rune) => {
                return Command::perform(apply_rune(auth_url, rune), Message::ApplyRuneDone);
            }
            Message::ApplyRuneDone(resp) => {
                if let Err(e) = resp {
                    dbg!("ApplyRuneError: {:?}", e);
                }
            }
            Message::OnSelectRuneSource(source) => {
                *self.current_source.lock().unwrap() = source.clone();
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
            Message::TickRun => {}
        }
        Command::none()
    }

    fn view(&self) -> Element<Message> {
        let sources = self.source_list.lock().unwrap();
        let selected = self.selected_sources.lock().unwrap();
        let champions_map = self.champions_map.lock().unwrap();

        let auth_url = self.auth_url.lock().unwrap();
        // let is_tencent = self.is_tencent.lock().unwrap();
        let lol_running = if auth_url.is_empty() { false } else { true };

        // let current_champion = self.current_champion.lock().unwrap();
        let runes = self.current_champion_runes.lock().unwrap();
        let loading_runes = self.loading_runes.lock().unwrap();
        let current_source = self.current_source.lock().unwrap();
        let avatar_guard = self.current_champion_avatar.lock().unwrap();
        let rune_images = self.rune_images.lock().unwrap();

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
            .height(Length::Fill)
            .width(Length::Fill)
            .spacing(8.)
            .padding(16.);
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
                                .height(28.)
                                .width(28.),
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
                .align_items(Alignment::Center);
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
                Scrollable::new(source_list_col)
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
                        Some(current_source.clone()),
                        Message::OnSelectRuneSource,
                    ),
                    avatar_row.padding(Padding::from([0, 8, 0, 0])),
                )
                .align_items(Alignment::Center)
                .padding(Padding::from([0, 0, 16, 0])),
                Scrollable::new(rune_list_col)
                    .height(Length::Fill)
                    .width(Length::Fill)
            ]
            .padding(Padding::from([8, 0]))
            .width(Length::FillPortion(2))
        ]
        .spacing(8)
        .width(Length::Fill)
        .height(Length::FillPortion(2));

        let remote_data_info = if *self.fetched_remote_data.lock().unwrap() {
            text(format!(
                "Fetched avaliable sources: {:?}, champions: {:?}",
                sources.len(),
                champions_map.len()
            ))
        } else {
            text("Loading...")
        };

        let apply_btn = button(
            text(fonts::IconChar::Rocket.as_str())
                .font(fonts::ICON_FONT)
                .horizontal_alignment(alignment::Horizontal::Center)
                .vertical_alignment(alignment::Vertical::Center),
        )
        .on_press(Message::ApplyBuilds)
        .padding(8.);

        let lcu_connect_info = if lol_running {
            format!("Connected to League of Legends.")
        } else {
            format!("Not connected to League of Legends.")
        };
        let btn_with_tooltip = row!(tooltip(apply_btn, "Apply Build!", tooltip::Position::Top))
            .padding(Padding::from([16, 0, 0, 0]));

        let bot_col = column![remote_data_info, text(lcu_connect_info), btn_with_tooltip]
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

        Subscription::batch([time_subscription])
    }
}
