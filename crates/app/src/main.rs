#[tokio::main]
async fn main() -> Result<(), ()> {
    source_gui::run().await.unwrap();
    rune_gui::run().await.unwrap();
    Ok(())
}
