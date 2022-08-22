#[cfg(target_os = "windows")]
pub fn get_commandline() {
    let cmd_str = r#"Get-CimInstance Win32_Process -Filter "name = 'LeagueClientUx.exe'" | Select-Object -ExpandProperty CommandLine"#;
    let ps = powershell_script::PsScriptBuilder::new()
        .no_profile(true)
        .non_interactive(true)
        .hidden(true)
        .print_commands(false)
        .build();
    let output = ps.run(&cmd_str).unwrap();
    println!("stdout: {}", output.stdout().unwrap());
}

#[cfg(not(target_os = "windows"))]
pub fn get_commandline() {
    println!("[cmd::get_commandline] not implemented");
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn run_cmd() {
        get_commandline();
    }
}
