use crate::constants::ALL_CHAMPION_IDS;

#[allow(unused)]
fn get_random_champion_id() -> i64 {
    use rand::seq::SliceRandom;

    *ALL_CHAMPION_IDS.choose(&mut rand::thread_rng()).unwrap()
}
