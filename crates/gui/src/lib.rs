use std::sync::{Arc, RwLock};

use lcu::{cmd::CommandLineOutput, task};
use wind::run_app;

pub mod config;
pub mod rune_ui;
pub mod toggle_ui;
pub mod source_ui;
pub mod wind;

pub type ILCUAuth = Arc<RwLock<CommandLineOutput>>;
pub type IChampionId = Arc<RwLock<Option<i64>>>;

pub fn run_champr() {
    let lcu_auth: ILCUAuth = Arc::new(RwLock::new(CommandLineOutput::default()));
    let lcu_auth_ui = lcu_auth.clone();

    let champion_id: IChampionId = Arc::new(RwLock::new(None));
    let champion_id_ui = champion_id.clone();

    let watch_auth_handle = tokio::spawn(async move {
        task::watch_auth_and_champion(lcu_auth, champion_id).await;
    });
    let _auth_handle = Some(watch_auth_handle.abort_handle());

    let _ = run_app(lcu_auth_ui, champion_id_ui);
}
