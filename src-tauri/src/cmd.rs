const APP_PORT_KEY: &str = "--app-port=";
const TOKEN_KEY: &str = "--remoting-auth-token=";

pub fn make_auth_url(token: &String, port: &String) -> String {
    format!("riot:{token}@127.0.0.1:{port}")
}

// #[cfg(target_os = "windows")]
pub fn get_commandline() -> String {
    let cmd_str = r#"Get-CimInstance Win32_Process -Filter "name = 'LeagueClientUx.exe'" | Select-Object -ExpandProperty CommandLine"#;
    let port_regexp = regex::Regex::new(r"--app-port=\d+").unwrap();
    let token_regexp = regex::Regex::new(r"--remoting-auth-token=\w+").unwrap();

    let ps = powershell_script::PsScriptBuilder::new()
        .no_profile(true)
        .non_interactive(true)
        .hidden(true)
        .print_commands(false)
        .build();
    let output = ps.run(&cmd_str).unwrap();
    let stdout = output.stdout().unwrap();
    println!("stdout: {}", &stdout);

    let port_match = port_regexp.find(&stdout).unwrap();
    let port = port_match.as_str().replace(APP_PORT_KEY, "");
    let token_match = token_regexp.find(&stdout).unwrap();
    let token = token_match.as_str().replace(TOKEN_KEY, "");
    let auth_url = make_auth_url(&port, &token);
    println!("auth url: {}", &auth_url);
    auth_url
}

// #[cfg(not(target_os = "windows"))]
// pub fn get_commandline() {
//     println!("[cmd::get_commandline] not implemented");
// }

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn run_cmd() {
        get_commandline();
    }
}
