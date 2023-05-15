use std::sync::{Arc, Mutex};

use iced::executor;
use iced::widget::{checkbox, Column, Container, Scrollable};
use iced::{Application, Command, Element, Font, Length, Settings, Theme};
use sources::SourceItem;

pub mod sources;

const ICON_FONT: Font = Font::External {
    name: "Icons",
    bytes: include_bytes!("./icons.ttf"),
};

pub fn main() -> iced::Result {
    ChampRUi::run(Settings::default())
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

        let mut col = Column::new().width(Length::Fill);
        for item in sources.clone() {
            let label = item.label.clone();
            let value = item.value.clone();
            let checked = selected.contains(&value);

            let custom_checkbox = checkbox(label, checked, move |_checked| {
                Message::UpdateSelected(value.clone())
            })
            .icon(checkbox::Icon {
                font: ICON_FONT,
                code_point: '\u{e901}',
                size: None,
            });
            col = col.push(custom_checkbox);
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
