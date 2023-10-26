use eframe::egui;
use std::{
    sync::{Arc, Mutex},
    time::Duration,
};
use tokio::task::AbortHandle;

use lcu::cmd::{self, CommandLineOutput};

async fn watch(ui_ctx: Arc<Mutex<Option<egui::Context>>>, lcu_auth: Arc<Mutex<CommandLineOutput>>) {
    loop {
        println!(".");
        let mut repaint = false;

        {
            let cmd_output = cmd::get_commandline();
            let mut ui_auth = lcu_auth.lock().unwrap();
            if !cmd_output.auth_url.eq(&ui_auth.auth_url) {
                *ui_auth = cmd_output;
                repaint = true;
            }
        }

        {
            if repaint {
                let ui_ctx = ui_ctx.lock().unwrap();
                let ctx = ui_ctx.as_ref();
                match ctx {
                    Some(x) => {
                        x.request_repaint();
                    }
                    _ => (),
                };
            }
        }

        tokio::time::sleep(Duration::from_millis(2500)).await;
    }
}

#[derive(Default)]
pub struct App {
    pub url: String,
    pub lcu_auth: Arc<Mutex<CommandLineOutput>>,
    pub lcu_task_handle: Option<AbortHandle>,
}

impl App {
    pub fn new(
        lcu_task_handle: Option<AbortHandle>,
        lcu_auth: Arc<Mutex<CommandLineOutput>>,
    ) -> Self {
        Self {
            lcu_task_handle,
            lcu_auth,
            ..Default::default()
        }
    }
}

impl eframe::App for App {
    fn on_close_event(&mut self) -> bool {
        if let Some(handle) = &self.lcu_task_handle {
            handle.abort();
        }

        true
    }

    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        let auth = self.lcu_auth.lock().unwrap();

        egui::CentralPanel::default().show(ctx, |ui| {
            ui.label(format!("AUTH: {:?}", auth.auth_url));
        });
    }
}

pub struct AppContext {
    pub ctx: Arc<Mutex<Option<egui::Context>>>,
    pub auth: Arc<Mutex<CommandLineOutput>>,
}

pub async fn run() -> Result<(), eframe::Error> {
    let ui_cc: Arc<Mutex<Option<egui::Context>>> = Arc::new(Mutex::new(None));
    let ui_cc_clone = ui_cc.clone();

    let lcu_auth = Arc::new(Mutex::new(CommandLineOutput::default()));
    let lcu_auth_ui = lcu_auth.clone();
    let watch_task_handle = tokio::spawn(async move {
        watch(ui_cc, lcu_auth).await;
    });
    let lcu_task_handle = Some(watch_task_handle.abort_handle());

    let native_options = eframe::NativeOptions::default();
    eframe::run_native(
        "Runes",
        native_options,
        Box::new(move |cc| {
            ui_cc_clone.lock().unwrap().replace(cc.egui_ctx.clone());
            Box::new(App::new(lcu_task_handle, lcu_auth_ui))
        }),
    )?;
    Ok(())
}
