pub mod builds;
pub mod cmd;
pub mod lcu;
pub mod source_item;
pub mod ui;
pub mod web_service;

use std::collections::HashMap;
use std::sync::{Arc, Mutex};
use std::time::Duration;

use builds::Rune;
use iced::alignment::{self, Horizontal, Vertical};
use iced::widget::{
    button, checkbox, column, image, pick_list, row, text, Column, Container, Row, Scrollable,
};
use iced::window::{PlatformSpecific, Position};
use iced::{executor, window, Alignment, Padding, Subscription};
use iced::{Application, Command, Element, Length, Settings, Theme};

use lcu::api::{apply_rune, LcuError};
use lcu::client::LcuClient;
use source_item::SourceItem;
use ui::{ChampR, LogItem};
use web_service::{ChampionsMap, FetchError, DataDragonRune};

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
        default_font: Some(include_bytes!("./fonts/LXGWNeoXiHei.ttf")),
        default_text_size: 14.,
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
            Command::perform(web_service::init_for_ui(), Message::InitRemoteData),
        )
    }

    fn title(&self) -> String {
        String::from("ChampR")
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
                let logs = self.logs.clone();

                let dir_gruard = self.lcu_dir.lock().unwrap();
                let dir = dir_gruard.clone();
                drop(dir_gruard);

                let selected_sources_guard = self.selected_sources.lock().unwrap();
                let selected_sources_clone = selected_sources_guard.clone();
                drop(selected_sources_guard);

                let champions_map_guard = self.champions_map.lock().unwrap();
                let champions_map_clone = champions_map_guard.clone();
                drop(champions_map_guard);

                return Command::perform(
                    builds::batch_apply(selected_sources_clone, champions_map_clone, dir, logs),
                    Message::ApplyBuildsDone,
                );
            }
            Message::ApplyBuildsDone(resp) => {
                if resp.is_ok() {
                    println!("Done: {:?}", self.logs);
                }
            }
            Message::ApplyRune(auth_url, rune) => {
                return Command::perform(
                    apply_rune(auth_url, rune),
                    Message::ApplyRuneDone,
                );
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
                        web_service::fetch_champion_runes(source, current_champion.clone()),
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
        let is_tencent = self.is_tencent.lock().unwrap();

        let current_champion = self.current_champion.lock().unwrap();
        let runes = self.current_champion_runes.lock().unwrap();
        let loading_runes = self.loading_runes.lock().unwrap();
        let current_source = self.current_source.lock().unwrap();
        let avatar_guard = self.current_champion_avatar.lock().unwrap();

        let title = text("ChampR - Builds, Runes AIO")
            .size(26.)
            .width(Length::Fill)
            .horizontal_alignment(Horizontal::Center);
        let title = Row::new().push(title).padding(6).width(Length::Fill);

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
            let mode_text = SourceItem::get_mode_text(item);
            source_list_col = source_list_col.push(
                row![
                    cbox,
                    row![text(mode_text)
                        .size(16.)
                        .vertical_alignment(Vertical::Center)]
                ]
                .spacing(8.),
            );
        }

        let mut rune_list_col = column!()
            .height(Length::Fill)
            .width(Length::Fill)
            .spacing(8.)
            .padding(16.);
        if *loading_runes {
            rune_list_col = rune_list_col
                .push(text("Loading runes...").horizontal_alignment(alignment::Horizontal::Center));
        } else {
            for r in runes.iter() {
                let row = row![
                    text(r.name.clone()).size(16.).width(Length::FillPortion(2)),
                    row![button("Apply").on_press(Message::ApplyRune(auth_url.clone(), r.clone()))]
                        .align_items(Alignment::End)
                        .width(Length::FillPortion(1)),
                ]
                .align_items(Alignment::Center);
                rune_list_col = rune_list_col.push(row);
            }
        }

        let rune_list_title = if current_champion.len() > 0 {
            text(format!("Champion: {current_champion}"))
        } else {
            text("Champion: None")
        };

        let avatar_row = if let Some(b) = avatar_guard.clone() {
            let handle = image::Handle::from_memory(b);
            row!(image::viewer(handle).height(48.).width(48.))
        } else {
            row!()
        };

        let main_row = row![
            column![
                row![text("Source List").size(22.)].padding(Padding::from([0, 0, 0, 16])),
                Scrollable::new(source_list_col)
                    .height(Length::Fill)
                    .width(Length::Fill)
            ]
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
                rune_list_title,
                rune_list_col
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
        let lcu_info = text(format!("auth url: {auth_url}, tencent: {is_tencent}"));
        let apply_btn = button("Apply").on_press(Message::ApplyBuilds).padding(8.);
        let bot_col = column![remote_data_info, lcu_info, apply_btn]
            .spacing(8)
            .padding(8.)
            .width(Length::Fill)
            .height(Length::FillPortion(1))
            .align_items(Alignment::Center);
        let content = Column::new().push(title).push(main_row).push(bot_col);

        Container::new(content)
            .width(Length::Fill)
            .height(Length::Fill)
            .into()
    }

    fn subscription(&self) -> Subscription<Message> {
        let time_subscription =
            iced::time::every(Duration::from_millis(400)).map(|_| Message::TickRun);

        Subscription::batch([time_subscription])
    }
}
