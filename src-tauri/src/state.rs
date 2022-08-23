use std::sync::Mutex;

#[derive(Clone, serde::Serialize, Default, Debug)]
pub struct InnerState {
    pub is_lcu_running: bool,
}

impl InnerState {
    pub fn set_lcu_running_state(&mut self, s: bool) {
        self.is_lcu_running = s;
    }

    pub fn init() -> Self {
        Self {
            is_lcu_running: false,
        }
    }
}

pub struct GlobalState(pub Mutex<InnerState>);

impl GlobalState {
    pub fn init() -> Self {
        Self(Mutex::new(InnerState::init()))
    }
}
