#[cfg(windows)]
extern crate embed_resource;
#[cfg(windows)]
extern crate winres;

fn main() {
    if std::env::var("PROFILE").unwrap() == "release" && cfg!(target_os = "windows") {
        embed_resource::compile("champr-manifest.rc", embed_resource::NONE);
        let mut res = winres::WindowsResource::new();
        res.set_icon("assets/icon@2x_r.ico")
            .set("InternalName", "CHAMPR.EXE");
        res.compile().unwrap();
    }
}
