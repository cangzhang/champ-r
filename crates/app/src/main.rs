use cushy::reactive::value::{Destination, Dynamic, Source, Switchable};
use cushy::widget::{MakeWidget, WidgetList};
use cushy::widgets::checkbox::{Checkable, CheckboxState};
use cushy::widgets::label::Displayable;
use cushy::{Open, PendingApp, TokioRuntime};
use kv_log_macro::info;
use std::vec;
use std::{env, fs, time::Duration};

use lcu::cmd::{CommandLineOutput, get_commandline};
use lcu::{source::SourceItem, web};

#[tokio::main]
async fn main() -> cushy::Result<()> {
    femme::with_level(femme::LevelFilter::Info);

    let tmp_dir = env::temp_dir();
    let mut tmp_perks_dir = tmp_dir.clone();
    tmp_perks_dir.push("perks");
    let _ = fs::create_dir(&tmp_perks_dir);
    info!("temp perks dir: {}", tmp_perks_dir.display());

    let app = PendingApp::new(TokioRuntime::default());

    let selected_sources: Dynamic<Vec<String>> = Dynamic::new(vec![]);
    let selected_sources2 = selected_sources.clone();

    let source_list = Dynamic::new(None::<Vec<SourceItem>>);
    tokio::spawn(load_source_list(source_list.clone()));
    
    let lcu_auth = Dynamic::new(None::<CommandLineOutput>);
    let lcu_auth2 = lcu_auth.clone();
    tokio::spawn(async move {
        let lcu_auth = lcu_auth.clone();
        loop {
            if let Ok(output) = get_commandline() {
                lcu_auth.replace(Some(output));
            }
            tokio::time::sleep(Duration::from_secs(2)).await;
        }
    });

    source_list
        .switcher(move |source_list, _| {
            if let Some(source_list) = source_list {
                let selected_sources = selected_sources.clone();
                source_list
                    .into_iter()
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
        .and(
            lcu_auth2.switcher({
                move |lcu_auth, _| {
                    if let Some(lcu_auth) = lcu_auth {
                        lcu_auth.auth_url.clone().into_label().make_widget()
                    } else {
                        "⚠️ League client is not running.".into_label().make_widget()
                    }
                }
            })
        )
        .into_rows()
        .centered()
        .run_in(app)
}

async fn load_source_list(list: Dynamic<Option<Vec<SourceItem>>>) {
    if let Ok(sources) = web::fetch_sources().await {
        list.set(Some(sources));
    }
}
