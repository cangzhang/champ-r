use iced::{widget::button::{Appearance, self}, Theme};
use iced_native::{Color, color};

pub struct CustomIconButtonStyle;

impl button::StyleSheet for CustomIconButtonStyle {
    type Style = Theme;

    fn active(&self, _style: &Self::Style) -> Appearance {
        Appearance {
            border_radius: 180.,
            border_width: 1.,
            border_color: color!(229, 231, 235).into(),
            background: Some(color!(79, 85, 193).into()),
            text_color: Color::WHITE,
            ..Appearance::default()
        }
    }

    fn hovered(&self, style: &Self::Style) -> Appearance {
        Appearance {
            text_color: Color::WHITE,
            background: Some(color!(79, 85, 193, 0.9).into()),
            ..self.active(style)
        }
    }

    fn pressed(&self, style: &Self::Style) -> Appearance {
        Appearance {
            text_color: Color::WHITE,
            background: Some(color!(79, 85, 193, 0.8).into()),
            ..self.active(style)
        }
    }
}
