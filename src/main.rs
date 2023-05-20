pub mod source_item;
pub mod ui;
pub mod web_service;

use iced::alignment::{Horizontal, Vertical};
use iced::widget::{button, checkbox, column, row, text, Column, Container, Row, Scrollable};
use iced::window::{PlatformSpecific, Position};
use iced::{executor, window, Alignment, Padding};
use iced::{Application, Command, Element, Length, Settings, Theme};

use source_item::SourceItem;
use ui::ChampR;
use web_service::{ChampionsMap, FetchError};

pub fn main() -> iced::Result {
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
        flags: (),
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
}

impl Application for ChampR {
    type Executor = executor::Default;
    type Message = Message;
    type Theme = Theme;
    type Flags = ();

    fn new(_flags: ()) -> (Self, Command<Message>) {
        (
            Default::default(),
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
        }
        Command::none()
    }

    fn view(&self) -> Element<Message> {
        let sources = self.source_list.lock().unwrap();
        let selected = self.selected_sources.lock().unwrap();
        let champions_map = self.champions_map.lock().unwrap();

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

        let text_info = if self.fetched_remote_data {
            text(format!(
                "Fetched avaliable sources: {:?}, champions: {:?}",
                sources.len(),
                champions_map.len()
            ))
        } else {
            text("Loading...")
        };
        let apply_btn = button("Apply").on_press(Message::ApplyBuilds).padding(8.);
        let bot_col = column![text_info, apply_btn]
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
}