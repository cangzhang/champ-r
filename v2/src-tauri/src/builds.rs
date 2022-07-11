use futures::StreamExt;
use std::io::Write;
use rand::Rng;

use crate::web;

pub fn make_id() -> String {
    rand::thread_rng()
        .sample_iter(&rand::distributions::Alphanumeric)
        .take(30)
        .map(char::from)
        .collect()
}

pub async fn save_build(path: String, data: &web::ItemBuild) -> anyhow::Result<()> {
    let path = std::path::Path::new(&path);
    let prefix = path.parent().unwrap();
    std::fs::create_dir_all(prefix).unwrap();

    let mut f = std::fs::File::create(&path)?;
    let buf = serde_json::to_string(&data)?;
    f.write_all(&buf[..].as_bytes())?;
    Ok(())
}

pub async fn apply_builds(
    sources: Vec<String>,
    dir: String,
    keep_old: bool,
    window: Option<&tauri::Window>,
) -> anyhow::Result<Vec<(bool, String, String)>> {
    let dir_path = std::path::Path::new(&dir);
    println!("dir: {:?}", dir_path);
    let path_exists = dir_path.exists();
    if path_exists && !keep_old {
        tokio::fs::remove_dir_all(dir.clone()).await?;
        println!("[builds] emptied dir: {}", dir);
        match window {
            Some(w) => {
                let _ = w.emit("apply_build_result", vec!["emptied_lol_builds_dir".to_string(), make_id()]);
            }
            _ => {}
        }
    }

    let lol_ver = web::fetch_lol_latest_version().await?;
    let champ_list_resp = web::fetch_champ_list(&lol_ver).await?;
    let mut tasks = vec![];
    let (tx, rx) = std::sync::mpsc::channel();
    for (champ_name, _champ) in champ_list_resp.data.iter() {
        for source in sources.iter() {
            let champ_name = champ_name.clone();
            // let source = source.clone();
            let npm_name = format!("@champ-r/{}", &source);
            let path = &dir;
            let tx = tx.clone();

            tasks.push(async move {
                let resp =
                    web::fetch_champ_file(&npm_name, &"latest".to_string(), &champ_name).await;
                let data = match resp {
                    Ok(data) => match data {
                        Some(data) => data,
                        _ => vec![],
                    },
                    _ => vec![],
                };
                if data.len() == 0 {
                    tx.send((false, source.clone(), champ_name.clone()))
                        .unwrap();
                    match window {
                        Some(w) => {
                            let _ = w.emit(
                                "apply_build_result",
                                (false, source.clone(), champ_name.clone(), make_id()),
                            );
                        }
                        _ => {}
                    }
                    println!("apply failed: {} {}", &source, &champ_name);
                }

                for (idx, i) in data.iter().enumerate() {
                    for (iidx, build) in i.item_builds.iter().enumerate() {
                        match window {
                            Some(w) => {
                                let _ = w.emit(
                                    "apply_build_result",
                                    ("ready_to_fetch".to_string(), source.clone(), champ_name.clone(), make_id()),
                                );
                            }
                            _ => {}
                        }
                        let p = format!(
                            "{path}/{champ_name}/{source}-{champ_name}-{idx}-{iidx}.json",
                            path = path,
                            source = source,
                            champ_name = champ_name,
                            idx = idx,
                            iidx = iidx
                        );
                        let r = match save_build(p, build).await {
                            Ok(_) => {
                                tx.send((true, source.clone(), champ_name.clone())).unwrap();
                                true
                            }
                            Err(e) => {
                                println!("save err: {:?}", e);
                                tx.send((false, source.clone(), champ_name.clone()))
                                    .unwrap();
                                false
                            }
                        };
                        match window {
                            Some(w) => {
                                let _ = w.emit(
                                    "apply_build_result",
                                    (r, source.clone(), champ_name.clone(), make_id()),
                                );
                            }
                            _ => {
                                println!("window not defined, skipped emitting.");
                            }
                        }
                    }
                }
            })
        }
    }

    futures::stream::iter(tasks)
        .buffer_unordered(10)
        .collect::<Vec<()>>()
        .await;

    drop(tx);
    let mut results: Vec<(bool, String, String)> = vec![];
    for r in rx {
        if r.0 == false {
            println!("{:?}", r);
        }
        results.push(r);
    }

    println!("all {}", results.len());
    match window {
        Some(w) => {
            let _ = w.emit(
                "apply_build_result",
                ("finished", make_id()),
            );
        }
        _ => {
            println!("window not defined, skipped emitting.");
        }
    }
    Ok(results)
}

pub fn spawn_apply_task(sources: Vec<String>, dir: String, keep_old: bool, window: &tauri::Window) {
    let w = window.clone();
    async_std::task::spawn(async move {
        let _ = apply_builds(sources, dir, keep_old, Some(&w)).await;
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn save_build() {
        let sources = vec![
            "op.gg-aram".to_string(),
            // "op.gg".to_string(),
            // "lolalytics".to_string(),
            "lolalytics-aram".to_string(),
        ];
        let folder = "../.cdn_files".to_string();
        let keep_old = false;

        println!(
            "start: save builds to local, sources: {:?}, keep old items: {}",
            sources, keep_old
        );

        match apply_builds(sources, folder, keep_old, None).await {
            Ok(_) => {
                println!("all set");
            }
            Err(e) => {
                println!("{:?}", e);
            }
        }
    }
}
