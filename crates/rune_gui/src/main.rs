#[tokio::main]
async fn main() -> Result<(), eframe::Error> {
    rune_gui::run().await?;
    Ok(())
}
