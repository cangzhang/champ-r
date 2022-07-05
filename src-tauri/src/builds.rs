use futures::StreamExt;
use std::io::Write;

use crate::web;

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
) -> anyhow::Result<Vec<(bool, String, String)>> {
    let dir_path = std::path::Path::new(&dir);
    println!("dir: {:?}", dir_path);
    let path_exists = dir_path.exists();
    if path_exists && !keep_old {
        tokio::fs::remove_dir_all(dir.clone()).await?;
        println!("[builds] emptied dir: {}", dir);
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
                    println!("apply failed: {} {}", &source, &champ_name)
                }

                for (idx, i) in data.iter().enumerate() {
                    for (iidx, build) in i.item_builds.iter().enumerate() {
                        let p = format!(
                            "{path}/{champ_name}/{source}-{champ_name}-{idx}-{iidx}.json",
                            path = path,
                            source = source,
                            champ_name = champ_name,
                            idx = idx,
                            iidx = iidx
                        );
                        match save_build(p, build).await {
                            Ok(_) => {
                                tx.send((true, source.clone(), champ_name.clone())).unwrap();
                            }
                            Err(e) => {
                                println!("save err: {:?}", e);
                                tx.send((false, source.clone(), champ_name.clone()))
                                    .unwrap();
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
    Ok(results)
}

pub fn spawn_apply_task(sources: Vec<String>, dir: String, keep_old: bool) {
    async_std::task::spawn(async move {
        let _ = apply_builds(sources, dir, keep_old).await;
    });
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn save_build() {
        let sources = vec![
            // "op.gg-aram".to_string(),
            "op.gg".to_string(),
            // "lolalytics".to_string(),
            // "lolalytics-aram".to_string(),
        ];
        let folder = "../.cdn_files".to_string();
        let keep_old = false;

        println!(
            "start: save builds to local, sources: {:?}, keep old items: {}",
            sources, keep_old
        );

        match apply_builds(sources, folder, keep_old).await {
            Ok(_) => {
                println!("all set");
            }
            Err(e) => {
                println!("{:?}", e);
            }
        }
    }
}
