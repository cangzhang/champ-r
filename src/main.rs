#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use std::{thread, time::Duration};

use slint::SharedString;
use worker::Message;

pub mod builds;
pub mod cmd;
pub mod config;
pub mod lcu;
pub mod source;
pub mod ui;
pub mod constants;
pub mod web;
pub mod worker;

slint::include_modules!();

fn main() {
    let ui = AppWindow::new().unwrap();
    let ui_worker = worker::UIWorker::new(&ui);

    let ui_handle = ui.as_weak();
    ui.global::<GlobalSettings>().on_update_selected_source(move |s: SharedString, checked: bool| {
        let ui = ui_handle.unwrap();
        let selected = ui.global::<GlobalSettings>().get_selected();
        println!("{}: {}, {:?}", s, checked, selected);
        // ui.set_selected(s, checked);
    });

    {
        let channel = ui_worker.channel.clone();
        channel.send(Message::InitData).unwrap();

        let selected = vec![String::from("op.gg"), String::from("op.gg-aram")];
        channel
            .send(Message::UpdateSelectedSources(selected))
            .unwrap();
    }

    {
        let channel = ui_worker.channel.clone();
        thread::spawn(move || loop {
            let output = cmd::get_commandline();
            channel.send(Message::UpdateCommandLine(output)).unwrap();

            thread::sleep(Duration::from_millis(2500));
        });
    }

    ui.run().unwrap();
    ui_worker.join().unwrap();
}
