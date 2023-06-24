use iced_native::window::{Icon, icon};

const ICON_IMAGE: &[u8] = include_bytes!("../assets/icon@2x_r.png");

pub fn load_icon() -> Icon  {
    let image = image::load_from_memory(ICON_IMAGE)
        .expect("Failed to open icon path")
        .into_rgba8();
    let (width, height) = image.dimensions();
    let rgba = image.into_raw();
    icon::from_rgba(rgba, width, height).expect("Failed to load icon")
}
