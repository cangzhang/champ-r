use std::sync::Mutex;

#[derive(Clone, serde::Serialize, Default, Debug)]
pub struct InnerState {
    pub is_lcu_running: bool,
    pub auth_url: String,
}

impl InnerState {
    pub fn set_lcu_running_state(&mut self, s: bool) {
        self.is_lcu_running = s;
    }

    pub fn update_auth_url(&mut self, url: &String) -> bool {
        if self.auth_url.eq(url) {
            return false;
        }

        self.auth_url = url.to_string();
        println!("[state] updated auth_url {}", url);
        return true;
    }

    pub fn init() -> Self {
        Self {
            is_lcu_running: false,
            auth_url: String::new(),
        }
    }
}

pub struct GlobalState(pub Mutex<InnerState>);

impl GlobalState {
    pub fn init() -> Self {
        Self(Mutex::new(InnerState::init()))
    }
}
