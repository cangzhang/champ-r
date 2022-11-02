use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};

const APP_PORT_KEY: &'static str = "--app-port=";
const TOKEN_KEY: &'static str = "--remoting-auth-token=";
const REGION_KEY: &'static str = "--region=";
const DIR_KEY: &'static str = "--install-directory=";

lazy_static! {
    static ref PORT_REGEXP: regex::Regex = regex::Regex::new(r"--app-port=\d+").unwrap();
    static ref TOKEN_REGEXP: regex::Regex =
        regex::Regex::new(r"--remoting-auth-token=\S+").unwrap();
    static ref REGION_REGEXP: regex::Regex = regex::Regex::new(r"--region=\S+").unwrap();
    static ref DIR_REGEXP: regex::Regex = regex::Regex::new(r"--install-directory=\S+").unwrap();
}

pub fn make_auth_url(token: &String, port: &String) -> String {
    format!("riot:{token}@127.0.0.1:{port}")
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
pub struct CommandLineOutput {
    pub auth_url: String,
    pub is_tencent: bool,
    pub token: String,
    pub port: String,
    pub dir: String,
}

#[cfg(target_os = "windows")]
pub fn get_commandline() -> CommandLineOutput {
    let cmd_str = r#"Get-CimInstance Win32_Process -Filter "name = 'LeagueClientUx.exe'"| Select-Object -ExpandProperty CommandLine"#;
    match powershell_script::run(&cmd_str) {
        Ok(output) => {
            if let Some(stdout) = output.stdout() {
                match_stdout(&stdout)
            } else {
                println!("[cmd] got nothing from output, maybe lcu is stopped");
                CommandLineOutput {
                    ..Default::default()
                }
            }
        }
        Err(e) => {
            println!("Error: {}", e);
            println!("[cmd] maybe you should run it with admin privilege");
            CommandLineOutput {
                ..Default::default()
            }
        }
    }
}

#[cfg(not(target_os = "windows"))]
pub fn get_commandline() -> (String, bool, bool, String, String) {
    use std::io::{BufRead, BufReader};
    use std::process::{Command, Stdio};

    let cmd_str = r#"ps -A | grep LeagueClientUx | grep remoting-auth-token="#;
    let mut cmd = Command::new("sh")
        .args(&["-c", cmd_str])
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();

    let mut auth_url = String::new();
    let mut token = String::new();
    let mut port = String::new();
    let mut running = false;
    let mut is_tencent = false;
    {
        let stdout = cmd.stdout.as_mut().unwrap();
        let stdout_reader = BufReader::new(stdout);
        let stdout_lines = stdout_reader.lines();

        for line in stdout_lines {
            match line {
                Ok(s) => {
                    if s.contains("--app-port=") {
                        (auth_url, is_tencent, token, port) = match_stdout(&s);
                        running = true;
                        break;
                    }
                }
                Err(e) => {
                    println!("[cmd::get_commandline] {:?}", e);
                }
            }
        }
    }
    cmd.wait().unwrap();

    (auth_url, running, token, port)
}

pub fn match_stdout(stdout: &String) -> CommandLineOutput {
    let port_match = PORT_REGEXP.find(&stdout).unwrap();
    let port = port_match.as_str().replace(APP_PORT_KEY, "");
    let token_match = TOKEN_REGEXP.find(&stdout).unwrap();
    let token = token_match
        .as_str()
        .replace(TOKEN_KEY, "")
        .replace("\\", "")
        .replace("\"", "");
    let auth_url = make_auth_url(&token, &port);
    let region_match = REGION_REGEXP.find(&stdout).unwrap();
    let region = region_match
        .as_str()
        .replace(REGION_KEY, "")
        .replace("\\", "")
        .replace("\"", "");
    let is_tencent = if region.eq("TENCENT") { true } else { false };
    let dir_match = DIR_REGEXP.find(&stdout).unwrap();
    let dir = dir_match.as_str().replace(DIR_KEY, "").replace("\"", "");
    let dir = format!("{dir}/..");

    CommandLineOutput {
        auth_url,
        is_tencent,
        token,
        port,
        dir,
    }
}

#[cfg(target_os = "windows")]
pub async fn spawn_apply_rune(token: &String, port: &String, perk: &String) -> anyhow::Result<()> {
    use std::{os::windows::process::CommandExt, process::Command};

    let perk = base64::encode(perk);
    Command::new("./LeagueClient.exe")
        .args(["rune", token, port, &perk])
        .creation_flags(0x08000000)
        .spawn()
        .expect("[spawn_apply_rune] failed");

    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub async fn spawn_apply_rune(perk: String) -> anyhow::Result<()> {
    Ok(())
}

#[cfg(target_os = "windows")]
pub async fn spawn_league_client(
    token: &String,
    port: &String,
    champion_map: &std::collections::HashMap<String, crate::web::ChampInfo>,
    win: Option<&tauri::Window>,
) -> anyhow::Result<()> {
    use std::io::{BufRead, BufReader, Error, ErrorKind};
    use std::os::windows::process::CommandExt;
    use std::path::Path;
    use std::process::{Command, Stdio};

    use serde_json::json;
    use tauri::Manager;

    println!(
        "[spawn] LeagueClient eixsts? {:?}",
        Path::new("./LeagueClient.exe").exists()
    );
    println!("[spawn] auth: {} {}", token, port);

    let stdout = Command::new("./LeagueClient.exe")
        .args([token, port])
        .creation_flags(0x08000000)
        .stdout(Stdio::piped())
        .spawn()?
        .stdout
        .ok_or_else(|| Error::new(ErrorKind::Other, "Could not capture standard output."))?;

    let reader = BufReader::new(stdout);
    let mut champ_id: i64 = 0;
    reader
        .lines()
        .filter_map(|line| line.ok())
        .for_each(|line| {
            if line.starts_with("=== champion id:") {
                let champ_id_str = line.trim().replace("=== champion id:", "");
                champ_id = champ_id_str.parse().unwrap();

                if champ_id > 0 {
                    println!("[watch champ select] {champ_id}");
                    let champion_alias =
                        crate::web::get_alias_from_champion_map(champion_map, champ_id);

                    let payload = json!({
                        "action": "on_champ_select",
                        "alias": champion_alias,
                        "id": champ_id,
                    });
                    if let Some(win) = win {
                        win.trigger_global("global_events", Some(payload.to_string()));
                    }
                } else {
                    #[cfg(not(debug_assertions))]
                    if let Some(win) = win {
                        let payload = json!({
                            "action": "hide_rune_win",
                        })
                        .to_string();
                        win.trigger_global("global_events", Some(payload));
                    }
                }
            }
        });

    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub async fn spawn_league_client() -> anyhow::Result<()> {
    Ok(())
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn run_cmd() {
        let ret = get_commandline();
        println!("{:?}", ret);
    }
}
