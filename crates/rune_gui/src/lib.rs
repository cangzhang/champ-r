use bytes::Bytes;
use eframe::egui;
use poll_promise::Promise;
use std::{
    sync::{Arc, Mutex},
    time::Duration,
};
use tokio::task::AbortHandle;

use lcu::{
    api,
    asset_loader::AssetLoader,
    cmd::{self, CommandLineOutput},
};
use lcu::{
    api::{LcuError, OwnedChampion},
    web::FetchError,
};

async fn watch(
    ui_ctx: Arc<Mutex<Option<egui::Context>>>,
    lcu_auth: Arc<Mutex<CommandLineOutput>>,
    champion_id: Arc<Mutex<Option<u64>>>,
) {
    loop {
        println!(".");
        let mut repaint = false;

        {
            let cmd_output = cmd::get_commandline();
            let mut ui_auth = lcu_auth.lock().unwrap();
            if !cmd_output.auth_url.eq(&ui_auth.auth_url) {
                println!("auth_url: {}", cmd_output.auth_url);
                *ui_auth = cmd_output;
                repaint = true;
            }
        }

        let auth_url = lcu_auth.lock().unwrap().auth_url.clone();
        let full_url = format!("https://{}", auth_url);
        if let Ok(Some(cid)) = api::get_session(&full_url).await {
            let cur_id = champion_id.lock().unwrap().unwrap_or_default();
            if cur_id != cid {
                *champion_id.lock().unwrap() = Some(cid);
                repaint = true;
                println!("current champion id: {}", cid);
            }
        } else {
            *champion_id.lock().unwrap() = None;
            repaint = true;
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
    pub owned_champions: Vec<OwnedChampion>,
    #[cfg_attr(feature = "serde", serde(skip))]
    pub owned_champions_promise: Option<Promise<Result<Vec<OwnedChampion>, LcuError>>>,
    pub champion_id: Arc<Mutex<Option<u64>>>,
    pub champion_avatar_promise: Option<Promise<Result<Bytes, FetchError>>>,
}

impl App {
    pub fn new(
        lcu_task_handle: Option<AbortHandle>,
        lcu_auth: Arc<Mutex<CommandLineOutput>>,
        champion_id: Arc<Mutex<Option<u64>>>,
    ) -> Self {
        Self {
            lcu_task_handle,
            lcu_auth,
            champion_id,
            ..Default::default()
        }
    }
}

impl eframe::App for App {
    fn update(&mut self, ctx: &egui::Context, _frame: &mut eframe::Frame) {
        let auth = self.lcu_auth.lock().unwrap();
        let connected_to_lcu = !auth.auth_url.is_empty();

        let full_auth_url = if connected_to_lcu {
            format!("https://{}", auth.auth_url)
        } else {
            String::new()
        };
        egui::CentralPanel::default().show(ctx, |ui| {
            if connected_to_lcu {
                ui.label(format!("AUTH: {:?}", full_auth_url));

                let cid = self.champion_id.lock().unwrap().unwrap_or_default();
                if cid > 0 {
                    let champion_avatar_url = format!(
                        "lcu-{full_auth_url}/lol-game-data/assets/v1/champion-icons/{cid}.png"
                    );
                    ui.add(
                        egui::Image::new(champion_avatar_url)
                            .max_size(egui::vec2(64., 64.))
                            .rounding(10.0),
                    );
                    // ui.add(
                    //     egui::Image::new("https://picsum.photos/64")
                    //         .max_size(egui::vec2(64., 64.))
                    //         .rounding(10.0),
                    // );
                }

                match &self.owned_champions_promise {
                    Some(p) => match p.ready() {
                        None => {
                            ui.spinner();
                        }
                        Some(Ok(owned_champions)) => {
                            self.owned_champions = owned_champions.clone();
                            ui.label(format!("owned champion count: {}", owned_champions.len()));
                        }
                        Some(Err(err)) => {
                            ui.label(format!("Failed to list owned champions: {:?}", err));
                        }
                    },
                    None => {
                        let promise = Promise::spawn_async(async move {
                            api::list_owned_champions(&full_auth_url).await
                        });
                        self.owned_champions_promise = Some(promise);
                    }
                };
            }
        });
    }

    fn on_close_event(&mut self) -> bool {
        if let Some(handle) = &self.lcu_task_handle {
            handle.abort();
        }

        true
    }
}

pub async fn run() -> Result<(), eframe::Error> {
    let ui_cc: Arc<Mutex<Option<egui::Context>>> = Arc::new(Mutex::new(None));
    let ui_cc_clone = ui_cc.clone();

    let lcu_auth = Arc::new(Mutex::new(CommandLineOutput::default()));
    let lcu_auth_ui = lcu_auth.clone();
    let champion_id = Arc::new(Mutex::new(None));
    let champion_id_ui = champion_id.clone();
    // let owned_champions: Arc<Mutex<Vec<OwnedChampion>>> = Arc::new(Mutex::new(vec![]));

    let watch_task_handle = tokio::spawn(async move {
        watch(ui_cc, lcu_auth, champion_id).await;
    });
    let lcu_task_handle = Some(watch_task_handle.abort_handle());

    let native_options = eframe::NativeOptions::default();
    eframe::run_native(
        "Runes",
        native_options,
        Box::new(move |cc| {
            // This gives us image support:
            egui_extras::install_image_loaders(&cc.egui_ctx);
            let _ = &cc
                .egui_ctx
                .add_bytes_loader(Arc::new(AssetLoader::default()));

            ui_cc_clone.lock().unwrap().replace(cc.egui_ctx.clone());
            Box::new(App::new(lcu_task_handle, lcu_auth_ui, champion_id_ui))
        }),
    )?;
    Ok(())
}
