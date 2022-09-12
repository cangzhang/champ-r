use lazy_static::lazy_static;

const APP_PORT_KEY: &str = "--app-port=";
const TOKEN_KEY: &str = "--remoting-auth-token=";

pub fn make_auth_url(token: &String, port: &String) -> String {
    format!("riot:{token}@127.0.0.1:{port}")
}

lazy_static! {
    static ref PORT_REGEXP: regex::Regex = regex::Regex::new(r"--app-port=\d+").unwrap();
    static ref TOKEN_REGEXP: regex::Regex =
        regex::Regex::new(r"--remoting-auth-token=\S+").unwrap();
}

#[cfg(target_os = "windows")]
pub fn get_commandline() -> (String, bool) {
    let cmd_str = r#"Get-CimInstance Win32_Process -Filter "name = 'LeagueClientUx.exe'"| Select-Object -ExpandProperty CommandLine"#;
    match powershell_script::run(&cmd_str) {
        Ok(output) => {
            if let Some(stdout) = output.stdout() {
                let port_match = PORT_REGEXP.find(&stdout).unwrap();
                let port = port_match.as_str().replace(APP_PORT_KEY, "");
                let token_match = TOKEN_REGEXP.find(&stdout).unwrap();
                let token = token_match
                    .as_str()
                    .replace(TOKEN_KEY, "")
                    .replace("\\", "")
                    .replace("\"", "");
                let auth_url = make_auth_url(&token, &port);
                (auth_url, true)
            } else {
                println!("[cmd] got nothing from output, maybe lcu is stopped");
                (String::from(""), false)
            }
        }
        Err(e) => {
            println!("Error: {}", e);
            println!("[cmd] maybe you should run it with admin privilege");
            (String::from(""), false)
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn get_commandline() -> (String, bool) {
    println!("[cmd::get_commandline] not implemented");
    (String::from(""), false)
}

// pub fn update_lcu_state(state: tauri::State<'_, crate::state::GlobalState>) {
//    let mut state_guard = state.0.lock().unwrap();
//    let (_auth_url, s) = get_commandline();
//    state_guard.ws_client.set_lcu_status(s);
//    // *state_guard = crate::state::InnerState {
//    //     is_lcu_running: s,
//    //     auth_url,
//    //     ws_client: None,
//    // }
//}

// pub async fn watch_lcu_status<'a>(state: &'a tauri::State<'_, crate::state::GlobalState>) {
//    let (tx, rx) = std::sync::mpsc::channel();
//    let _handle = async_std::task::spawn(async move {
//        loop {
//            let ret = get_commandline();
//            let tx = tx.clone();
//            let _r = tx.send(ret); // TODO! `sending on closed channel` error
//            std::thread::sleep(std::time::Duration::from_millis(5000));
//        }
//    });

//    let (auth_url, running) = match rx.recv() {
//        Ok(r) => r,
//        Err(_) => (String::from(""), false),
//    };
//    let mut state_guard = state.0.lock().unwrap();
//    state_guard.ws_client.set_lcu_status(running);
//    state_guard.ws_client.update_auth_url(&auth_url);
//    println!("[interval task] update inner state.");
// }

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn run_cmd() {
        get_commandline();
    }
}
