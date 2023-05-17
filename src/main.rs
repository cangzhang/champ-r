use std::sync::{Arc, Mutex};

use iced::widget::{checkbox, Column, Container, Scrollable};
use iced::window::{PlatformSpecific, Position};
use iced::{executor, window};
use iced::{Application, Command, Element, Length, Settings, Theme};
use sources::SourceItem;

pub mod sources;

pub fn main() -> iced::Result {
    ChampRUi::run(Settings {
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
        default_font: Some(include_bytes!("./subset/sarasa-mono-sc-regular.subset.ttf")),
        default_text_size: 16.,
        text_multithreading: true,
        antialiasing: false,
        exit_on_close_request: true,
        try_opengles_first: false,
    })
}

#[derive(Default)]
pub struct ChampRUi {
    pub default_checkbox: bool,
    pub custom_checkbox: bool,
    pub source_list: Arc<Mutex<Vec<SourceItem>>>,
    pub selected_sources: Arc<Mutex<Vec<String>>>,
}

#[derive(Debug)]
pub enum Message {
    FetchedSourceList(anyhow::Result<Vec<SourceItem>>),
    UpdateSelected(String),
}

impl Application for ChampRUi {
    type Executor = executor::Default;
    type Message = Message;
    type Theme = Theme;
    type Flags = ();

    fn new(_flags: ()) -> (Self, Command<Message>) {
        (
            Default::default(),
            Command::perform(sources::get_sources(), Message::FetchedSourceList),
        )
    }

    fn title(&self) -> String {
        String::from("Checkbox - Iced")
    }

    fn update(&mut self, message: Message) -> Command<Message> {
        match message {
            Message::FetchedSourceList(resp) => {
                if let Ok(sources) = resp {
                    *self.source_list.lock().unwrap() = sources;
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
        }
        Command::none()
    }

    fn view(&self) -> Element<Message> {
        let sources = self.source_list.lock().unwrap();
        let selected = self.selected_sources.lock().unwrap();

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
            col = col.push(cbox);
        }
        let scroll_list = Scrollable::new(col)
            .width(Length::Fill)
            .height(Length::Fill);
        let content = Column::new().push(scroll_list);

        Container::new(content)
            .width(Length::Fill)
            .height(Length::Fill)
            .into()
    }
}
