#[tokio::main]
async fn main() -> Result<(), ()> {
    source_window::run().await.unwrap();
    rune_window::run().await.unwrap();
    Ok(())
}
