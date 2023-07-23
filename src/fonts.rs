use iced::Font;

pub const SARSA_MONO_REGULAR_BYTES: &[u8] =
    include_bytes!("../assets/fonts/sarasa-mono-sc-regular.subset.ttf");

pub const SARSA_MONO_REGULAR: Font = Font::External {
    name: "sarasa-mono-sc-regular",
    bytes: SARSA_MONO_REGULAR_BYTES,
};

pub const SARSA_MONO_BOLD: Font = Font::External {
    name: "sarasa-mono-sc-bold",
    bytes: include_bytes!("../assets/fonts/sarasa-mono-sc-bold.subset.ttf"),
};

pub const ICON_FONT: Font = Font::External {
    name: "bootstrap-icons",
    bytes: include_bytes!("../assets/fonts/bootstrap-icons.ttf"),
};

pub enum IconChar {
    Rocket,
    InfoFill,
    InfoCircle,
    GitHub,
}

impl IconChar {
    pub fn as_str(&self) -> char {
        match self {
            IconChar::Rocket => '\u{f845}',
            IconChar::InfoFill => '\u{f430}',
            IconChar::InfoCircle => '\u{f431}',
            IconChar::GitHub => '\u{f3ed}',
        }
    }
}
