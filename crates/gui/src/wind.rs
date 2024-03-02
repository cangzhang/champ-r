use iced::event;
use iced::executor;
use iced::multi_window::{self, Application};
use iced::widget::{button, column, container, scrollable, text, text_input};
use iced::window;
use iced::{Alignment, Command, Element, Length, Point, Settings, Subscription, Theme, Vector};

use std::collections::HashMap;

#[derive(Default)]
struct App {
    windows: HashMap<window::Id, Window>,
    next_window_pos: window::Position,
}

#[derive(Debug)]
struct Window {
    theme: Theme,
}

#[derive(Debug, Clone)]
enum Message {
    CloseWindow(window::Id),
    WindowOpened(window::Id, Option<Point>),
    WindowClosed(window::Id),
    NewWindow,
}

impl Window {
    fn new(count: usize) -> Self {
        Self { theme: Theme::Dark }
    }

    fn view(&self, id: window::Id) -> Element<Message> {
        let new_window_button = button(text("New Window")).on_press(Message::NewWindow);

        let content = scrollable(
            column![new_window_button]
                .spacing(50)
                .width(Length::Fill)
                .align_items(Alignment::Center),
        );

        container(content).width(200).center_x().into()
    }
}

impl multi_window::Application for App {
    type Executor = executor::Default;
    type Message = Message;
    type Theme = Theme;
    type Flags = ();

    fn new(_flags: ()) -> (Self, Command<Message>) {
        (
            App {
                windows: HashMap::from([(window::Id::MAIN, Window::new(1))]),
                next_window_pos: window::Position::Default,
            },
            Command::none(),
        )
    }

    fn title(&self, window: window::Id) -> String {
        "ChampR".to_string()
    }

    fn update(&mut self, message: Message) -> Command<Message> {
        match message {
            Message::CloseWindow(id) => window::close(id),
            Message::WindowClosed(id) => {
                self.windows.remove(&id);
                Command::none()
            }
            Message::WindowOpened(id, position) => {
                if let Some(position) = position {
                    self.next_window_pos = window::Position::Specific(
                        position + Vector::new(20.0, 20.0),
                    );
                }

                Command::none()
            }
            Message::NewWindow => {
                let count = self.windows.len() + 1;

                let (id, spawn_window) = window::spawn(window::Settings {
                    position: self.next_window_pos,
                    exit_on_close_request: count % 2 == 0,
                    ..Default::default()
                });

                self.windows.insert(id, Window::new(count));

                spawn_window
            }
        }
    }

    fn view(&self, window: window::Id) -> Element<Message> {
        let content = self.windows.get(&window).unwrap().view(window);

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
        event::listen_with(|event, _| {
            if let iced::Event::Window(id, window_event) = event {
                match window_event {
                    window::Event::CloseRequested => {
                        Some(Message::CloseWindow(id))
                    }
                    window::Event::Opened { position, .. } => {
                        Some(Message::WindowOpened(id, position))
                    }
                    window::Event::Closed => Some(Message::WindowClosed(id)),
                    _ => None,
                }
            } else {
                None
            }
        })
    }
}

pub fn run_app() -> iced::Result {
    App::run(Settings::with_flags(()))
}
