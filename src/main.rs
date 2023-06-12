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
use iced::alignment::{Horizontal, Vertical};
use iced::widget::{button, checkbox, column, row, text, Column, Container, Row, Scrollable};
use iced::window::{PlatformSpecific, Position};
use iced::{executor, window, Alignment, Padding, Subscription};
use iced::{Application, Command, Element, Length, Settings, Theme};

use lcu::api::{apply_rune, LcuError};
use lcu::client::LcuClient;
use source_item::SourceItem;
use ui::{ChampR, LogItem};
use web_service::{ChampionsMap, FetchError};

pub fn main() -> iced::Result {
    let champions_map1: Arc<Mutex<ChampionsMap>> = Arc::new(Mutex::new(HashMap::new()));
    let champions_map2 = champions_map1.clone();

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
        ),
    })
}

#[derive(Debug, Clone)]
pub enum Message {
    InitRemoteData(Result<(Vec<SourceItem>, ChampionsMap), FetchError>),
    UpdateSelected(String),
    ApplyBuilds,
    TickRun,
    ApplyBuildsDone(Result<(), ()>),
    ApplyRune(String, Rune),
    ApplyRuneDone(Result<(), LcuError>),
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
                if let Ok((sources, champions_map)) = resp {
                    *self.source_list.lock().unwrap() = sources;
                    *self.champions_map.lock().unwrap() = champions_map;
                    self.fetched_remote_data = true;
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
                if let Ok(_) = resp {
                    println!("Done: {:?}", self.logs);
                }
            }
            Message::ApplyRune(auth_url, rune) => {
                let endpoint = format!("https://{auth_url}");
                return Command::perform(
                    apply_rune(endpoint.clone(), rune.clone()),
                    Message::ApplyRuneDone,
                );
            }
            Message::ApplyRuneDone(resp) => {
                if let Err(e) = resp {
                    dbg!("ApplyRuneError: {:?}", e);
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
            let mode_text = SourceItem::get_mode_text(&item);
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

        let rune_list_title = if current_champion.len() > 0 {
            text(format!(
                "Champion: {current_champion}, Runes: {:?}",
                runes.len()
            ))
        } else {
            text("Champion: None")
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
            column![rune_list_title, rune_list_col,]
                .padding(8.)
                .width(Length::FillPortion(2))
        ]
        .spacing(8)
        .width(Length::Fill)
        .height(Length::FillPortion(2));

        let remote_data_info = if self.fetched_remote_data {
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
            iced::time::every(Duration::from_millis(1000)).map(|_| Message::TickRun);

        Subscription::batch([time_subscription])
    }
}
