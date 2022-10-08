use lazy_static::lazy_static;

const APP_PORT_KEY: &'static str = "--app-port=";
const TOKEN_KEY: &'static str = "--remoting-auth-token=";

lazy_static! {
    static ref PORT_REGEXP: regex::Regex = regex::Regex::new(r"--app-port=\d+").unwrap();
    static ref TOKEN_REGEXP: regex::Regex =
        regex::Regex::new(r"--remoting-auth-token=\S+").unwrap();
}

pub fn make_auth_url(token: &String, port: &String) -> String {
    format!("riot:{token}@127.0.0.1:{port}")
}

#[cfg(target_os = "windows")]
pub fn get_commandline() -> (String, bool) {
    let cmd_str = r#"Get-CimInstance Win32_Process -Filter "name = 'LeagueClientUx.exe'"| Select-Object -ExpandProperty CommandLine"#;
    match powershell_script::run(&cmd_str) {
        Ok(output) => {
            if let Some(stdout) = output.stdout() {
                let auth_url = match_stdout(&stdout);
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
    use std::io::{BufRead, BufReader};
    use std::process::{Command, Stdio};

    let cmd_str = r#"ps -A | grep LeagueClientUx | grep remoting-auth-token="#;
    let mut cmd = Command::new("sh")
        .args(&["-c", cmd_str])
        .stdout(Stdio::piped())
        .spawn()
        .unwrap();

    let mut auth_url = String::new();
    let mut running = false;
    {
        let stdout = cmd.stdout.as_mut().unwrap();
        let stdout_reader = BufReader::new(stdout);
        let stdout_lines = stdout_reader.lines();

        for line in stdout_lines {
            match line {
                Ok(s) => {
                    if s.contains("--app-port=") {
                        auth_url = match_stdout(&s);
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

    (auth_url, running)
}

pub fn match_stdout(stdout: &String) -> String {
    let port_match = PORT_REGEXP.find(&stdout).unwrap();
    let port = port_match.as_str().replace(APP_PORT_KEY, "");
    let token_match = TOKEN_REGEXP.find(&stdout).unwrap();
    let token = token_match
        .as_str()
        .replace(TOKEN_KEY, "")
        .replace("\\", "")
        .replace("\"", "");
    let auth_url = make_auth_url(&token, &port);
    auth_url
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
