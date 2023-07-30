#[derive(Clone, Copy)]
pub enum StyleVariant {
    IconButton,
    BigIconButton,
    Unknown,
}

pub struct StyleTuple(pub StyleVariant);

impl Clone for StyleTuple {
    fn clone(&self) -> Self {
        Self(self.0)
    }
}