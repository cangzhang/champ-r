use std::{
    sync::{Arc, Mutex, RwLock},
    time::Duration,
};

use crate::{
    api,
    cmd::{self, CommandLineOutput},
    constants::ALL_CHAMPION_IDS,
};

fn get_random_champion_id() -> i64 {
    use rand::seq::SliceRandom;

    *ALL_CHAMPION_IDS.choose(&mut rand::thread_rng()).unwrap()
}
