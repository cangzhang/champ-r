// https://github.com/tauri-apps/tauri/discussions/4201#discussioncomment-3279531
extern crate embed_resource;

fn main() {
    tauri_build::build();
    // #[cfg(target_os = "windows")]
    // embed_resource::compile("champr-manifest.rc");
}
