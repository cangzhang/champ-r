use iced::{
    color,
    widget::button::{self, Appearance},
    Color, Theme,
};

use super::style_tuple::{StyleTuple, StyleVariant};

impl From<StyleTuple> for iced::theme::Button {
    fn from(tuple: StyleTuple) -> Self {
        iced::theme::Button::Custom(Box::new(tuple))
    }
}

impl button::StyleSheet for StyleTuple {
    type Style = Theme;

    fn active(&self, _style: &Self::Style) -> Appearance {
        Appearance {
            border_radius: match self {
                StyleTuple(StyleVariant::BigIconButton) => 180.0.into(),
                StyleTuple(StyleVariant::IconButton) => 6.0.into(),
                StyleTuple(_) => 0.0.into(),
            },
            background: match self {
                StyleTuple(_) => Some(color!(79, 85, 193).into()),
            },
            text_color: match self {
                StyleTuple(StyleVariant::BigIconButton) => Color::WHITE,
                StyleTuple(StyleVariant::IconButton) => Color::WHITE,
                StyleTuple(_) => Color::BLACK,
            },
            ..Appearance::default()
        }
    }

    fn hovered(&self, style: &Self::Style) -> Appearance {
        Appearance {
            text_color: match self {
                StyleTuple(StyleVariant::BigIconButton) => Color::WHITE,
                StyleTuple(StyleVariant::IconButton) => Color::WHITE,
                StyleTuple(_) => Color::BLACK,
            },
            ..self.active(style)
        }
    }

    fn pressed(&self, style: &Self::Style) -> Appearance {
        Appearance {
            ..self.active(style)
        }
    }
}
