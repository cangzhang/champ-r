use iced::{widget::button, Theme};

pub struct CustomIconButtonStyle;

impl button::StyleSheet for CustomIconButtonStyle {
    type Style = Theme;

    fn active(&self, _style: &Self::Style) -> button::Appearance {
        button::Appearance {
            border_radius: 180.,
            border_width: 1.,
            border_color: [0.0, 0.0, 0.0].into(),
            ..button::Appearance::default()
        }
    }
}
