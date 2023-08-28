#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use slint::SharedString;
use worker::Message;

pub mod builds;
pub mod cmd;
pub mod components;
pub mod config;
pub mod fonts;
pub mod lcu;
pub mod source;
pub mod styles;
pub mod ui;
pub mod utils;
pub mod web;
pub mod worker;

slint::include_modules!();

fn main() {
    let ui = AppWindow::new().unwrap();

    let ui_worker = worker::UIWorker::new(&ui);

    let ui_handle = ui.as_weak();
    ui.on_request_increase_value(move || {
        let ui = ui_handle.unwrap();
        ui.set_counter(ui.get_counter() + 1);
    });

    let ui_handle = ui.as_weak();
    ui.on_updateChecked(move |s: SharedString, checked: bool| {
        let ui = ui_handle.unwrap();
        let selected = ui.get_selected();
        println!("{}: {}, {:?}", s, checked, selected);
        // ui.set_selected(s, checked);
    });

    {
        let channel = ui_worker.channel.clone();
        channel.send(Message::InitData).unwrap();
    }

    ui.run().unwrap();
    ui_worker.join().unwrap();
}
