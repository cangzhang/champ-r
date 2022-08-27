use lazy_static::lazy_static;

const APP_PORT_KEY: &str = "--app-port=";
const TOKEN_KEY: &str = "--remoting-auth-token=";
const PS_GET_COMMANDLINE: &str = r#"Get-CimInstance Win32_Process -Filter "name = 'LeagueClientUx.exe'" | Select-Object -ExpandProperty CommandLine"#;

pub fn make_auth_url(token: &String, port: &String) -> String {
    format!("riot:{token}@127.0.0.1:{port}")
}

lazy_static! {
    static ref PORT_REGEXP: regex::Regex = regex::Regex::new(r"--app-port=\d+").unwrap();
    static ref TOKEN_REGEXP: regex::Regex =
        regex::Regex::new(r"--remoting-auth-token=\S+").unwrap();
}

// #[cfg(target_os = "windows")]
pub fn get_commandline() -> (String, bool) {
    let ps = powershell_script::PsScriptBuilder::new()
        .no_profile(true)
        .non_interactive(true)
        .hidden(true)
        .print_commands(false)
        .build();
    let output = ps.run(&PS_GET_COMMANDLINE).unwrap();
    match output.stdout() {
        Some(stdout) => {
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
        }
        None => {
            println!("[cmd] perhaps LCU is not running.");
            (String::from(""), false)
        }
    }
}

// #[cfg(not(target_os = "windows"))]
// pub fn get_commandline() -> String {
//     println!("[cmd::get_commandline] not implemented");
//     String::from("_")
// }

pub fn update_lcu_state(state: tauri::State<'_, crate::state::GlobalState>) {
    let mut state_guard = state.0.lock().unwrap();
    let (auth_url, s) = get_commandline();
    state_guard.set_lcu_running_state(s);
    *state_guard = crate::state::InnerState {
        is_lcu_running: s,
        auth_url,
    }
}

pub fn start_lcu_task(state: tauri::State<'_, crate::state::GlobalState>) {
    let (tx, rx) = std::sync::mpsc::channel();
    let _handle = async_std::task::spawn(async move {
        let _id = tokio_js_set_interval::set_interval!(
            move || {
                let ret = get_commandline();
                let tx = tx.clone();
                let _r = tx.send(ret); // TODO! `sending on closed channel` error
            },
            3000
        );
    });

    let (auth_url, running) = match rx.recv() {
        Ok(r) => r,
        Err(_) => ("".to_string(), false),
    };
    let mut state_guard = state.0.lock().unwrap();
    state_guard.set_lcu_running_state(running);
    let updated = state_guard.update_auth_url(&auth_url);
    println!("[interval task] update inner state.");

    if !updated {
        return;
    }

    async_std::task::spawn(async move {
        let mut url = String::from("wss://");
        url.push_str(&auth_url);
        let _ = crate::ws::start_client(&url).await;
    });

    // *state_guard = crate::state::InnerState {
    //     is_lcu_running: running,
    //     auth_url,
    // };
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn run_cmd() {
        get_commandline();
    }
}
