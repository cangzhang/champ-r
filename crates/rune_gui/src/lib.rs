use eframe::egui;
use std::sync::{Arc, Mutex};


fn slow_process(state_clone: Arc<Mutex<State>>) {
    loop {
        std::thread::sleep(std::time::Duration::from_millis(2500));
        let mut state = state_clone.lock().unwrap();
        *state = State {
            duration: 2500,
            show_decoration: !state.show_decoration,
            should_update: true,
            ctx: state.ctx.clone(),
        };

        let ctx = &state.ctx;
        match ctx {
            Some(x) => {
                x.request_repaint();
            },
            None => panic!("error in Option<>"),
        };
        drop(state);
    }
}

struct State {
    duration: u64,
    show_decoration: bool,
    should_update: bool,
    ctx: Option<egui::Context>,
}

impl State {
    pub fn new() -> Self {
        Self {
            duration: 0,
            ctx: None,
            show_decoration: true,
            should_update: false,
        }
    }
}

pub struct App {
    state: Arc<Mutex<State>>, 
}

impl App {
    pub fn new(cc: &eframe::CreationContext<'_>) -> Self {
        let state = Arc::new(Mutex::new(State::new()));
        state.lock().unwrap().ctx = Some(cc.egui_ctx.clone());
        let state_clone = state.clone();
        std::thread::spawn(move || {
            slow_process(state_clone);
        });
        Self {
            state,
        }
    }
}

impl eframe::App for App {
    fn update(&mut self, ctx: &egui::Context, frame: &mut eframe::Frame) {
        let mut st = self.state.lock().unwrap();
        let should_update = st.should_update;
        if should_update {
            frame.set_decorations(st.show_decoration);
            *st = State {
                duration: 2500,
                show_decoration: st.show_decoration,
                should_update: false,
                ctx: st.ctx.clone(),
            };
        }
        drop(st);

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.label(format!("woke up after {}ms", self.state.lock().unwrap().duration));
        });
        println!(".");
    }
}

pub fn run() -> Result<(), eframe::Error> {
    let native_options = eframe::NativeOptions::default();
    eframe::run_native(
        "eframe template",
        native_options,
        Box::new(|cc| Box::new(App::new(cc))),
    )
}