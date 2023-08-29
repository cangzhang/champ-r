#[cfg(windows)]
extern crate embed_resource;
#[cfg(windows)]
extern crate winres;

// #[cfg(target_os = "windows")]
// fn main() {
//     if std::env::var("PROFILE").unwrap() == "release" {
//         embed_resource::compile("champr-manifest.rc", embed_resource::NONE);
//         let mut res = winres::WindowsResource::new();
//         res.set_icon("assets/icon@2x_r.ico")
//             .set("InternalName", "CHAMPR.EXE");
//         res.compile().unwrap();
//     }
// }

// #[cfg(not(target_os = "windows"))]
// fn main() {
// }

fn main() {
    slint_build::compile("ui/main.slint").unwrap();
}
