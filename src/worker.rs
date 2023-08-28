use std::io::{Error, ErrorKind};
use std::rc::Rc;

use crate::source::SourceItem;
use crate::web;

use super::{AppWindow, UISource};
use futures::FutureExt;
use slint::{ComponentHandle, Model, ModelRc, SharedString, VecModel};
use tokio::io::{AsyncBufReadExt, BufReader};
use tokio::sync::mpsc::{UnboundedReceiver, UnboundedSender};

#[derive(Debug)]
pub enum Message {
    FetchedSources(Vec<SourceItem>),
    InitData,
    Quit,
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
                println!("should init data");
                let ui = handle.clone();
                let sources = web::fetch_sources().await.unwrap();
                let ui_handle = ui.unwrap();

                let ui_sources = Rc::new(slint::VecModel::<UISource>::from(
                    sources
                        .iter()
                        .map(|s| UISource {
                            label: SharedString::from(&s.label),
                            value: SharedString::from(&s.value),
                            ..Default::default()
                        })
                        .collect::<Vec<_>>(),
                ));

                ui_handle.set_sources(ui_sources.into());

                return Ok(());
            }
            _ => return Ok(()),
        }
    }
}

// async fn prepare_sources(handle: slint::Weak<AppWindow>) -> tokio::io::Result<()> {
//     Ok(())
// }
