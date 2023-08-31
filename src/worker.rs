// use std::io::{Error, ErrorKind};
use std::rc::Rc;

// use crate::source::SourceItem;
use crate::{web, cmd::CommandLineOutput};

use super::{AppWindow, UISource};
use futures::FutureExt;
use slint::{ComponentHandle, Model, ModelRc, SharedString, VecModel};
// use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::mpsc::{UnboundedReceiver, UnboundedSender};

#[derive(Debug)]
pub enum Message {
    Quit,
    InitData,
    UpdateSelectedSources(Vec<String>),
    UpdateCommandLine(CommandLineOutput),
}

pub struct UIWorker {
    pub channel: UnboundedSender<Message>,
    worker_thread: std::thread::JoinHandle<()>,
}

impl UIWorker {
    pub fn new(ui: &AppWindow) -> Self {
        let (channel, r) = tokio::sync::mpsc::unbounded_channel();
        let worker_thread = std::thread::spawn({
            let handle_weak = ui.as_weak();
            move || {
                tokio::runtime::Runtime::new()
                    .unwrap()
                    .block_on(worker_loop(r, handle_weak))
                    .unwrap()
            }
        });
        Self {
            channel,
            worker_thread,
        }
    }

    pub fn join(self) -> std::thread::Result<()> {
        let _ = self.channel.send(Message::Quit);
        self.worker_thread.join()
    }
}

async fn worker_loop(
    mut r: UnboundedReceiver<Message>,
    handle: slint::Weak<AppWindow>,
) -> tokio::io::Result<()> {
    // let refresh_handle = tokio::task::spawn(start_task(handle.clone()));
    // let prepare_sources_future = prepare_sources(handle.clone()).fuse();
    // futures::pin_mut!(prepare_sources_future,);

    loop {
        let m = futures::select! {
            // res = prepare_sources_future => {
            //     continue;
            // }
            m = r.recv().fuse() => {
                match m {
                    None => return Ok(()),
                    Some(m) => m,
                }
            }
        };

        match m {
            Message::InitData => {
                let sources = web::fetch_sources().await.unwrap();
                let transformed_sources = sources
                    .iter()
                    .map(|s| UISource {
                        label: SharedString::from(&s.label),
                        value: SharedString::from(&s.value),
                        ..Default::default()
                    })
                    .collect::<Vec<_>>();
                handle
                    .clone()
                    .upgrade_in_event_loop(move |h| {
                        h.set_sources(ModelRc::from(Rc::new(VecModel::<UISource>::from(
                            transformed_sources,
                        ))));
                    })
                    .unwrap();
            }
            Message::UpdateSelectedSources(selected) => {
                handle
                    .clone()
                    .upgrade_in_event_loop(move |h| {
                        let sources_rc = h.get_sources();

                        let sources = sources_rc
                            .as_any()
                            .downcast_ref::<VecModel<UISource>>()
                            .unwrap();

                        let mut rows = vec![];
                        for idx in 0..sources.row_count() {
                            let s = sources.row_data(idx).unwrap();
                            rows.push(UISource {
                                label: s.label.clone(),
                                value: s.value.clone(),
                                is_aram: s.is_aram,
                                is_urf: s.is_urf,
                                checked: selected.contains(&s.value.to_string()),
                            });
                        }
                        h.set_sources(ModelRc::from(Rc::new(VecModel::<UISource>::from(rows))));
                    })
                    .unwrap();
            }
            Message::UpdateCommandLine(output) => {
                handle
                    .clone()
                    .upgrade_in_event_loop(move |h| {
                        h.set_auth_url(SharedString::from(&output.auth_url));
                        h.set_is_tencent(output.is_tencent);
                    })
                    .unwrap();
            }
            _ => (),
        };
    }
}
