use iced::{
    widget::button::{self, Appearance},
    Theme,
};
use iced_native::{color, Color};

use super::style_tuple::{StyleTuple, StyleVariant};

impl From<StyleTuple> for iced::theme::Button {
    fn from(tuple: StyleTuple) -> Self {
        iced::theme::Button::Custom(Box::new(tuple))
    }
}

impl button::StyleSheet for StyleTuple {
    type Style = Theme;

    fn active(&self, _style: &Self::Style) -> Appearance {
        match self {
            StyleTuple(StyleVariant::BigIconButton) => Appearance {
                border_radius: 180.,
                border_width: 1.,
                border_color: color!(229, 231, 235),
                background: Some(color!(79, 85, 193).into()),
                text_color: Color::WHITE,
                ..Appearance::default()
            },
            StyleTuple(StyleVariant::IconButton) => Appearance { 
                text_color: Color::BLACK,
                border_color: Color::WHITE,
                border_radius: 6., 
                border_width: 1., 
                background: Color::WHITE.into(),
                ..Appearance::default()
            },
            StyleTuple(_) => Appearance {
                ..Appearance::default()
            },
        }
    }

    fn hovered(&self, style: &Self::Style) -> Appearance {
        match self {
            StyleTuple(StyleVariant::BigIconButton) => Appearance {
                text_color: Color::WHITE,
                background: Some(color!(79, 85, 193, 0.9).into()),
                ..self.active(style)
            },
            StyleTuple(StyleVariant::IconButton) => Appearance {
                background: Some(color!(244, 244, 245).into()),
                ..self.active(style)
            },
            StyleTuple(_) => Appearance {
                ..self.active(style)
            },
        }
    }

    fn pressed(&self, style: &Self::Style) -> Appearance {
        match self {
            StyleTuple(StyleVariant::BigIconButton) => Appearance {
                text_color: Color::WHITE,
                background: Some(color!(79, 85, 193, 0.8).into()),
                ..self.active(style)
            },
            StyleTuple(StyleVariant::IconButton) => Appearance {
                background: Some(color!(244, 244, 245).into()),
                ..self.active(style)
            },
            StyleTuple(_) => Appearance {
                ..self.active(style)
            },
        }
    }
}
