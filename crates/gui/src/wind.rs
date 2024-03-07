use iced::event;
use iced::executor;
use iced::multi_window::{self, Application};
use iced::widget::{column, container, scrollable, text};
use iced::window;
use iced::{Alignment, Command, Element, Length, Settings, Subscription, Theme};
// use kv_log_macro::info;
// use lcu::cmd::CommandLineOutput;

use std::collections::HashMap;
use std::time::Duration;

use crate::IChampionId;
use crate::ILCUAuth;

#[derive(Default)]
struct ChampR {
    windows: HashMap<window::Id, Window>,
    lcu_auth: ILCUAuth,
    champion_id: IChampionId,
    local_champion_id: Option<i64>,
}

#[derive(Debug)]
pub enum ViewType {
    Rune,
    Source,
}

#[derive(Debug)]
struct Window {
    theme: Theme,
    view_type: ViewType,
}

#[derive(Debug, Clone)]
enum Message {
    CloseWindow(window::Id),
    WindowOpened(window::Id),
    WindowClosed(window::Id),
    OpenRuneWindow,
    TickRun,
    UpdateLocalChampionId(Option<i64>),
}

impl Window {
    fn new(view_type: ViewType) -> Self {
        Self {
            theme: Theme::Dark,
            view_type,
        }
    }

    fn view(&self, _id: window::Id, lcu_auth: &ILCUAuth) -> Element<Message> {
        match self.view_type {
            ViewType::Source => self.source_view(lcu_auth),
            ViewType::Rune => self.rune_view(),
        }
    }

    fn rune_view(&self) -> Element<Message> {
        let content = scrollable(
            column![text("Rune Window").width(Length::Fill).size(30),]
                .spacing(50)
                .width(Length::Fill)
                .align_items(Alignment::Center),
        );

        container(content).width(200).center_x().into()
    }

    fn source_view(&self, lcu_auth: &ILCUAuth) -> Element<Message> {
        let auth = lcu_auth.read().unwrap();
        let content = scrollable(
            column![text(auth.auth_url.clone()).width(Length::Fill),]
                .spacing(50)
                .width(Length::Fill)
                .align_items(Alignment::Center),
        );

        container(content).width(200).center_x().into()
    }
}

impl multi_window::Application for ChampR {
    type Executor = executor::Default;
    type Message = Message;
    type Theme = Theme;
    type Flags = ChampR;

    fn new(flags: ChampR) -> (Self, Command<Message>) {
        (
            Self {
                windows: HashMap::from([(window::Id::MAIN, Window::new(ViewType::Source))]),
                lcu_auth: flags.lcu_auth,
                champion_id: flags.champion_id,
                local_champion_id: None,
            },
            Command::none(),
        )
    }

    fn title(&self, _window: window::Id) -> String {
        "ChampR".to_string()
    }

    fn update(&mut self, message: Message) -> Command<Message> {
        match message {
            Message::CloseWindow(id) => window::close(id),
            Message::WindowClosed(id) => {
                self.windows.remove(&id);
                Command::none()
            }
            Message::WindowOpened(_id) => Command::none(),
            Message::OpenRuneWindow => {
                let count = self.windows.len() + 1;

                let (id, spawn_window) = window::spawn(window::Settings {
                    exit_on_close_request: count % 2 == 0,
                    ..Default::default()
                });

                self.windows.insert(id, Window::new(ViewType::Rune));

                spawn_window
            }
            Message::UpdateLocalChampionId(cid) => {
                self.local_champion_id = cid;
                if cid.is_some() {
                    return self.update(Message::OpenRuneWindow);
                }
                
                Command::none()
            }
            Message::TickRun => {
                let cid = *self.champion_id.read().unwrap();
                if cid != self.local_champion_id {
                    return self.update(Message::UpdateLocalChampionId(cid));
                }

                Command::none()
            },
        }
    }

    fn view(&self, window: window::Id) -> Element<Message> {
        let content = self
            .windows
            .get(&window)
            .unwrap()
            .view(window, &self.lcu_auth);

        container(content)
            .width(Length::Fill)
            .height(Length::Fill)
            .center_x()
            .center_y()
            .into()
    }

    fn theme(&self, window: window::Id) -> Self::Theme {
        self.windows.get(&window).unwrap().theme.clone()
    }

    fn scale_factor(&self, _window: window::Id) -> f64 {
        1.0
    }

    fn subscription(&self) -> Subscription<Self::Message> {
        let window_events_subscription = event::listen_with(|event, _| {
            if let iced::Event::Window(id, window_event) = event {
                match window_event {
                    window::Event::CloseRequested => Some(Message::CloseWindow(id)),
                    window::Event::Opened { .. } => Some(Message::WindowOpened(id)),
                    window::Event::Closed => Some(Message::WindowClosed(id)),
                    _ => None,
                }
            } else {
                None
            }
        });
        let time_subscription =
            iced::time::every(Duration::from_millis(1000)).map(|_| Message::TickRun);

        Subscription::batch([window_events_subscription, time_subscription])
    }
}

pub fn run_app(lcu_auth: ILCUAuth, champion_id: IChampionId) -> iced::Result {
    ChampR::run(Settings {
        flags: ChampR {
            lcu_auth,
            champion_id,
            ..Default::default()
        },
        ..Default::default()
    })
}
