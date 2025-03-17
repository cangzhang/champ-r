use cushy::reactive::value::{Destination, Dynamic, Source, Switchable};
use cushy::widget::{MakeWidget, WidgetList};
use cushy::widgets::checkbox::{Checkable, CheckboxState};
use cushy::widgets::label::Displayable;
use cushy::window::PendingWindow;
use cushy::{Open, PendingApp, TokioRuntime};
use kv_log_macro::info;
use std::vec;
use std::{env, fs, time::Duration};

use lcu::api::get_session;
use lcu::cmd::{get_commandline, CommandLineOutput};
use lcu::{source::SourceItem, web};

#[tokio::main]
async fn main() -> cushy::Result<()> {
    femme::with_level(femme::LevelFilter::Info);

    let tmp_dir = env::temp_dir();
    let mut tmp_perks_dir = tmp_dir.clone();
    tmp_perks_dir.push("perks");
    let _ = fs::create_dir(&tmp_perks_dir);
    info!("temp perks dir: {}", tmp_perks_dir.display());

    let mut app = PendingApp::new(TokioRuntime::default());

    let selected_sources: Dynamic<Vec<String>> = Dynamic::new(vec![]);
    let selected_sources2 = selected_sources.clone();

    let source_list = Dynamic::new(None::<Vec<SourceItem>>);
    tokio::spawn(load_source_list(source_list.clone()));

    let lcu_auth = Dynamic::new(None::<CommandLineOutput>);
    let lcu_auth2 = lcu_auth.clone();
    tokio::spawn(async move {
        loop {
            if let Ok(output) = get_commandline() {
                lcu_auth2.replace(Some(output));
            }
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });

    let lcu_auth3 = lcu_auth.clone();
    let rune_pw = PendingWindow::default();
    // let rune_handle = rune_pw.handle();
    let rune_window_visible = Dynamic::new(false);
    let rune_window_visible2 = rune_window_visible.clone();
    let rune_window = rune_pw
        .with_root("Runes".into_label().make_widget())
        .titled("Runes")
        .visible(rune_window_visible);
    tokio::spawn(async move {
        let visible = rune_window_visible2.clone();
        loop {
            if let Some(lcu_auth) = lcu_auth3.get() {
                let auth_url = format!("https://{}", &lcu_auth.auth_url);
                if let Ok(session) = get_session(&auth_url).await {
                    if let Some(champion_id) = session {
                        info!("champion_id: {}", champion_id);
                        if champion_id > 0 && !visible.get() {
                            visible.set(true);
                        }
                        tokio::time::sleep(Duration::from_secs(2)).await;
                        continue;
                    }
                }
            }

            visible.set(false);
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });

    rune_window.open(&mut app)?;

    source_list
        .switcher(move |source_list, _| {
            if let Some(source_list) = source_list {
                let selected_sources = selected_sources.clone();
                source_list
                    .iter()
                    .map(move |s| {
                        let selected_sources = selected_sources.clone();
                        let label = s.label.clone();
                        let value = s.value.clone();

                        let checkbox_state = Dynamic::new(CheckboxState::Unchecked);
                        let checkbox_state = checkbox_state.with_for_each(move |state| {
                            let selected_sources = selected_sources.clone();
                            match state {
                                CheckboxState::Checked => {
                                    let selected_sources = selected_sources.clone();
                                    let mut next = selected_sources.get();
                                    if !next.contains(&value) {
                                        next.push(value.clone());
                                        info!("selected sources: {:?}", next);
                                        selected_sources.set(next);
                                    }
                                }
                                CheckboxState::Unchecked => {
                                    let selected_sources = selected_sources.clone();
                                    let mut next = selected_sources.get();
                                    info!("source to remove: {:?}", value);
                                    next.retain(|s| s != &value);
                                    selected_sources.set(next);
                                }
                                CheckboxState::Indeterminant => (),
                            }
                        });

                        checkbox_state
                            .to_checkbox()
                            .labelled_by(label)
                            .make_widget()
                    })
                    .collect::<WidgetList>()
                    .into_rows()
                    .make_widget()
            } else {
                "No source list loaded".into_button().make_widget()
            }
        })
        .centered()
        .and(selected_sources2.switcher({
            move |selected_sources, _| {
                if selected_sources.is_empty() {
                    "No sources selected".into_label().make_widget()
                } else {
                    selected_sources
                        .iter()
                        .map(|s| s.clone().into_label().make_widget())
                        .collect::<WidgetList>()
                        .into_columns()
                        .make_widget()
                }
            }
        }))
        .and(lcu_auth.switcher({
            move |lcu_auth, _| {
                if let Some(lcu_auth) = lcu_auth {
                    lcu_auth.auth_url.clone().into_label().make_widget()
                } else {
                    "⚠️ League client is not running."
                        .into_label()
                        .make_widget()
                }
            }
        }))
        .into_rows()
        .centered()
        .make_widget()
        .to_window()
        .titled("ChampR")
        .run_in(app)
}

async fn load_source_list(list: Dynamic<Option<Vec<SourceItem>>>) {
    if let Ok(sources) = web::fetch_sources().await {
        list.set(Some(sources));
    }
}
