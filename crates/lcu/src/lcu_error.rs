#[derive(Debug, Clone)]
pub enum LcuError {
    APIError(String),
}

impl From<reqwest::Error> for LcuError {
    fn from(error: reqwest::Error) -> LcuError {
        println!("lcu api error: {:?}", error);
        LcuError::APIError(error.to_string())
    }
}

impl From<anyhow::Error> for LcuError {
    fn from(error: anyhow::Error) -> LcuError {
        println!("lcu api error: {:?}", error);
        LcuError::APIError(error.to_string())
    }
}
