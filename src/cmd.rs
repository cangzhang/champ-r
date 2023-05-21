use base64::{engine::general_purpose, Engine as _};
use lazy_static::lazy_static;
use serde::{Deserialize, Serialize};

use crate::web_service::ChampionsMap;

const APP_PORT_KEY: &str = "--app-port=";
const TOKEN_KEY: &str = "--remoting-auth-token=";
const REGION_KEY: &str = "--region=";
const DIR_KEY: &str = "--install-directory=";

lazy_static! {
    static ref PORT_REGEXP: regex::Regex = regex::Regex::new(r"--app-port=\d+").unwrap();
    static ref TOKEN_REGEXP: regex::Regex =
        regex::Regex::new(r"--remoting-auth-token=\S+").unwrap();
    static ref REGION_REGEXP: regex::Regex = regex::Regex::new(r"--region=\S+").unwrap();
    static ref DIR_REGEXP: regex::Regex =
        regex::Regex::new(r#"--install-directory=(.*?)""#).unwrap();
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
    match powershell_script::run(cmd_str) {
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
    let port_match = PORT_REGEXP.find(stdout).unwrap();
    let port = port_match.as_str().replace(APP_PORT_KEY, "");
    let token_match = TOKEN_REGEXP.find(stdout).unwrap();
    let token = token_match
        .as_str()
        .replace(TOKEN_KEY, "")
        .replace(['\\', '\"'], "");
    let auth_url = make_auth_url(&token, &port);
    let region_match = REGION_REGEXP.find(stdout).unwrap();
    let region = region_match
        .as_str()
        .replace(REGION_KEY, "")
        .replace(['\\', '\"'], "");
    let is_tencent = region.eq("TENCENT");
    let dir_match = DIR_REGEXP.find(stdout).unwrap();
    let dir = dir_match.as_str().replace(DIR_KEY, "");
    let dir = dir.replace('\"', "");
    let dir = if is_tencent {
        format!("{dir}/..")
    } else {
        format!("{dir}/")
    };

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

    let perk = general_purpose::STANDARD_NO_PAD.encode(perk);
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
    champion_map: &ChampionsMap,
) -> anyhow::Result<()> {
    use std::io::{BufRead, BufReader, Error, ErrorKind};
    use std::os::windows::process::CommandExt;
    use std::path::Path;
    use std::process::{Command, Stdio};

    println!(
        "[spawn] LeagueClient eixsts? {:?}",
        Path::new("./LeagueClient.exe").exists()
    );
    println!("[spawn] auth: {} {}", token, port);

    let stdout = Command::new("./LeagueClient.exe")
        .args(["watch", token, port])
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
                    let _champion_alias = get_alias_from_champion_map(champion_map, champ_id);
                } else {
                    // #[cfg(not(debug_assertions))]
                }
            }
        });

    Ok(())
}

#[cfg(not(target_os = "windows"))]
pub async fn spawn_league_client() -> anyhow::Result<()> {
    Ok(())
}

#[cfg(target_os = "windows")]
pub async fn check_if_server_ready() -> anyhow::Result<bool> {
    use std::io::{BufRead, BufReader, Error, ErrorKind};
    use std::os::windows::process::CommandExt;
    use std::process::{Command, Stdio};

    let CommandLineOutput {
        dir, is_tencent, ..
    } = get_commandline();

    if dir.is_empty() {
        println!("[cmd::check_if_tencent_server_ready] cannot get lcu install dir");
        return Ok(false);
    }

    let is_tencent_arg = if is_tencent { "1" } else { "0" };
    let stdout = Command::new("./LeagueClient.exe")
        .args(["check", &dir, is_tencent_arg])
        .creation_flags(0x08000000)
        .stdout(Stdio::piped())
        .spawn()?
        .stdout
        .ok_or_else(|| Error::new(ErrorKind::Other, "Could not capture standard output."))?;

    let mut ready = true;
    let reader = BufReader::new(stdout);
    reader
        .lines()
        .filter_map(|line| line.ok())
        .for_each(|line| {
            if line.starts_with("=== tencent_sucks") {
                ready = false;
            }
        });

    Ok(ready)
}

#[cfg(target_os = "windows")]
pub async fn fix_tencent_server() -> anyhow::Result<bool> {
    use std::io::{BufRead, BufReader, Error, ErrorKind};
    use std::os::windows::process::CommandExt;
    use std::process::{Command, Stdio};

    let CommandLineOutput { dir, .. } = get_commandline();

    let stdout = Command::new("./LeagueClient.exe")
        .args(["fix", &dir])
        .creation_flags(0x08000000)
        .stdout(Stdio::piped())
        .spawn()?
        .stdout
        .ok_or_else(|| Error::new(ErrorKind::Other, "Could not capture standard output."))?;

    let mut ready = false;
    let reader = BufReader::new(stdout);
    reader
        .lines()
        .filter_map(|line| line.ok())
        .for_each(|line| {
            if line.starts_with("=== tencent_fucked") {
                ready = true;
            }
        });

    Ok(ready)
}

#[cfg(not(target_os = "windows"))]
pub async fn fix_tencent_server() -> anyhow::Result<bool> {
    Ok(true)
}

#[cfg(target_os = "windows")]
pub async fn test_connectivity() -> anyhow::Result<bool> {
    use std::io::{BufRead, BufReader, Error, ErrorKind};
    use std::os::windows::process::CommandExt;
    use std::process::{Command, Stdio};

    let CommandLineOutput { port, token, .. } = get_commandline();

    let stdout = Command::new("./LeagueClient.exe")
        .args(["test", &token, &port])
        .creation_flags(0x08000000)
        .stdout(Stdio::piped())
        .spawn()?
        .stdout
        .ok_or_else(|| Error::new(ErrorKind::Other, "Could not capture standard output."))?;

    let mut connected = false;
    let reader = BufReader::new(stdout);
    reader
        .lines()
        .filter_map(|line| line.ok())
        .for_each(|line| {
            if line.starts_with("=== connected") {
                connected = true;
            }
        });

    Ok(connected)
}

#[cfg(not(target_os = "windows"))]
pub async fn test_connectivity() -> anyhow::Result<bool> {
    Ok(true)
}

pub fn check_if_lol_running() -> bool {
    let CommandLineOutput { port, token, .. } = get_commandline();
    !token.is_empty() && !port.is_empty()
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

pub fn get_alias_from_champion_map(champion_map: &ChampionsMap, champion_id: i64) -> String {
    let mut ret = String::new();
    for (alias, c) in champion_map.iter() {
        if c.key.eq(&champion_id.to_string()) {
            ret = alias.to_string();
            break;
        }
    }

    ret
}
