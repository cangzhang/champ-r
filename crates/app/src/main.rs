use cushy::animation::ZeroToOne;
use cushy::reactive::value::{Destination, Dynamic, Source, Switchable};
use cushy::widget::{MakeWidget, WidgetList};
use cushy::widgets::checkbox::{Checkable, CheckboxState};
use cushy::widgets::label::Displayable;
use cushy::widgets::progress::{Progress, Progressable};
use cushy::{Open, PendingApp, TokioRuntime};
use kv_log_macro::info;
use std::vec;
use std::{env, fs, time::Duration};

use lcu::{source::SourceItem, web};

#[derive(Debug, Default, Eq, PartialEq)]
struct Task {
    progress: Dynamic<Progress>,
}

#[tokio::main]
async fn main() -> cushy::Result<()> {
    femme::with_level(femme::LevelFilter::Info);

    let tmp_dir = env::temp_dir();
    let mut tmp_perks_dir = tmp_dir.clone();
    tmp_perks_dir.push("perks");
    let _ = fs::create_dir(&tmp_perks_dir);
    info!("temp perks dir: {}", tmp_perks_dir.display());

    let app = PendingApp::new(TokioRuntime::default());
    let task = Dynamic::new(None::<Task>);

    let selected_sources: Dynamic<Vec<String>> = Dynamic::new(vec![]);
    let selected_sources2 = selected_sources.clone();
    let source_list = Dynamic::new(None::<Vec<SourceItem>>);
    tokio::spawn(load_source_list(source_list.clone()));

    task.switcher(|task, dynamic| {
        if let Some(task) = task {
            // A background thread is running, show a progress bar.
            task.progress.clone().progress_bar().make_widget()
        } else {
            // There is no background task. Show a button that will start one.
            "Start"
                .into_button()
                .on_click({
                    let task = dynamic.clone();
                    move |_| {
                        let background_task = Task::default();
                        spawn_background_thread(&background_task.progress, &task);
                        task.set(Some(background_task));
                    }
                })
                .make_widget()
        }
    })
    // .and(
    //     "Load Source List"
    //         .into_button()
    //         .on_click({
    //             let source_list = source_list.clone();
    //             move |_| {
    //                 tokio::spawn(load_source_list(source_list.clone()));
    //             }
    //         })
    //         .make_widget(),
    // )
    .and(
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
                            checkbox_state.map_each(move |state| {
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
                                        next.retain(|src| src != &value);
                                        info!("selected sources: {:?}", next);
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
            .centered(),
    )
    .and(selected_sources2.switcher({
        move |selected_sources, _| {
            if selected_sources.is_empty() {
                "No sources selected".into_label().make_widget()
            } else {
                selected_sources
                    .iter()
                    .map(|s| s.clone().into_button().make_widget())
                    .collect::<WidgetList>()
                    .into_rows()
                    .make_widget()
            }
        }
    }))
    .into_rows()
    .centered()
    .run_in(app)
}

fn spawn_background_thread(progress: &Dynamic<Progress>, task: &Dynamic<Option<Task>>) {
    let progress = progress.clone();
    let task = task.clone();
    std::thread::spawn(move || background_task(&progress, &task));
}

fn background_task(progress: &Dynamic<Progress>, task: &Dynamic<Option<Task>>) {
    for i in 0_u8..=10 {
        progress.set(Progress::Percent(ZeroToOne::new(f32::from(i) / 10.)));
        std::thread::sleep(Duration::from_millis(100));
    }
    task.set(None);
}

async fn load_source_list(list: Dynamic<Option<Vec<SourceItem>>>) {
    if let Ok(sources) = web::fetch_sources().await {
        list.set(Some(sources));
    }
}
