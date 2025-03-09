use cushy::animation::ZeroToOne;
use cushy::reactive::value::{Destination, Dynamic, Switchable};
use cushy::widget::{MakeWidget, Widget, WidgetList};
use cushy::widgets::progress::{Progress, Progressable};
use cushy::{Open, PendingApp, TokioRuntime};
use kv_log_macro::info;
use std::{env, fs, time::Duration};

use lcu::{source::SourceItem, web};

#[derive(Debug, Default, Eq, PartialEq)]
struct Task {
    progress: Dynamic<Progress>,
}

fn main() -> cushy::Result<()> {
    femme::with_level(femme::LevelFilter::Info);

    let tmp_dir = env::temp_dir();
    let mut tmp_perks_dir = tmp_dir.clone();
    tmp_perks_dir.push("perks");
    let _ = fs::create_dir(&tmp_perks_dir);
    info!("temp perks dir: {}", tmp_perks_dir.display());

    let app = PendingApp::new(TokioRuntime::default());
    let task = Dynamic::new(None::<Task>);

    let source_list = Dynamic::new(None::<Vec<SourceItem>>);

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
    .and(
        "Load Source List"
            .into_button()
            .on_click({
                let source_list = source_list.clone();
                move |_| {
                    tokio::spawn(load_source_list(source_list.clone()));
                }
            })
            .make_widget(),
    )
    .and(
        source_list
            .switcher(|source_list, _| {
                if let Some(source_list) = source_list {
                    source_list
                        .into_iter()
                        .map(|s| {
                            s.label.clone().into_checkbox(cushy::reactive::value::Dynamic::new(false)).make_widget()
                        }).collect::<WidgetList>()
                        .into_rows()
                        .make_widget()
                } else {
                    "No source list loaded".into_button().make_widget()
                }
            })
            .centered(),
    )
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
