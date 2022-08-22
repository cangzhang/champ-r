// #[cfg(target_os = "windows")]
pub fn get_commandline() {
    let cmd_str = r#"Get-CimInstance Win32_Process -Filter "name = 'LeagueClientUx.exe'" | Select CommandLine | ConvertTo-Json"#;

    let child = std::process::Command::new("powershell")
        .args(["/C", &cmd_str])
        .spawn()
        .expect("[powershell] fail to run `Get-CimInstance`");
    let output = child.wait_with_output().expect("failed to wait on child");
    println!("status: {}", output.status);
    println!("stdout: {}", String::from_utf8_lossy(&output.stdout));
    println!("stderr: {}", String::from_utf8_lossy(&output.stderr));
}

// #[cfg(not(target_os = "windows"))]
// pub fn get_commandline() {}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn run_cmd() {
        get_commandline();
    }
}
