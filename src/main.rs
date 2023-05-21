pub mod source_item;
pub mod ui;
pub mod web_service;
pub mod lcu;
pub mod cmd;

use core::time;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

use cmd::CommandLineOutput;
use iced::alignment::{Horizontal, Vertical};
use iced::widget::{button, checkbox, column, row, text, Column, Container, Row, Scrollable};
use iced::window::{PlatformSpecific, Position};
use iced::{executor, window, Alignment, Padding, Subscription};
use iced::{Application, Command, Element, Length, Settings, Theme};

use source_item::SourceItem;
use ui::ChampR;
use web_service::{ChampionsMap, FetchError};

pub fn main() -> iced::Result {
    let auth_url1 = Arc::new(Mutex::new(String::new()));
    let auth_url2 = auth_url1.clone();
    
    let is_tencent1 = Arc::new(Mutex::new(false));
    let is_tencent2 = is_tencent1.clone();

    thread::Builder::new().name("check_auth_task".to_string()).spawn(move || {
        let mut count = 0;
        loop {
            let CommandLineOutput { auth_url, is_tencent, .. } = cmd::get_commandline();
            count += 1;
            *auth_url2.lock().unwrap() = format!("{auth_url}, No.{count}");
            *is_tencent2.lock().unwrap() = is_tencent;
            dbg!(auth_url, is_tencent, count);
            thread::sleep(time::Duration::from_secs(2));
        }
    }).unwrap();

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
        flags: ChampR::new(auth_url1, is_tencent1),
        default_font: Some(include_bytes!("./fonts/LXGWNeoXiHei.ttf")),
        default_text_size: 14.,
        text_multithreading: true,
        antialiasing: false,
        exit_on_close_request: true,
        try_opengles_first: false,
    })
}

#[derive(Debug, Clone)]
pub enum Message {
    InitRemoteData(Result<(Vec<SourceItem>, ChampionsMap), FetchError>),
    UpdateSelected(String),
    ApplyBuilds,
    TickRun,
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
                println!("apply builds");
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

        let title = text("ChampR - Builds, Runes AIO")
            .size(26.)
            .width(Length::Fill)
            .horizontal_alignment(Horizontal::Center);
        let title = Row::new().push(title).padding(6).width(Length::Fill);

        let mut col = Column::new().width(Length::Fill).spacing(8.).padding(16.);
        for item in sources.clone() {
            let label = item.label.clone();
            let value = item.value.clone();
            let checked = selected.contains(&value);

            let cbox = checkbox(label, checked, move |_checked| {
                Message::UpdateSelected(value.clone())
            })
            .text_size(20.)
            .spacing(6.);
            let mode_text = SourceItem::get_mode_text(&item);
            col = col.push(
                row![
                    cbox,
                    row![text(mode_text)
                        .size(16.)
                        .vertical_alignment(Vertical::Center)]
                ]
                .spacing(8.),
            );
        }
        let main_row = row![
            column![
                row![text("Source List").size(22.)].padding(Padding::from([0, 0, 0, 16])),
                Scrollable::new(col)
                    .height(Length::Fill)
                    .width(Length::Fill)
            ]
            .height(Length::Fill)
            .width(Length::FillPortion(2)),
            column![text("rune content here")]
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
        let time_subscription = iced::time::every(Duration::from_millis(1000)).map(|_| Message::TickRun);

        Subscription::batch([time_subscription])
    }
}
