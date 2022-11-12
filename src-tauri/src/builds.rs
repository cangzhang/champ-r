use anyhow::anyhow;
use async_compression::futures::bufread::GzipDecoder;
use futures::io::{self, BufReader, ErrorKind};
use futures::stream::TryStreamExt;
use futures::{AsyncReadExt, StreamExt};
use rand::Rng;
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::fs;
use std::io::{Cursor, Write};
use std::path::Path;
use tar::Archive;
use tauri::{AppHandle, Window};

use crate::{web, window};

const SOURCE_LIST_URL: &str = "https://mirrors.cloud.tencent.com/npm/@champ-r/source-list/latest";

pub fn empty_rune_type() -> String {
    String::new()
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
struct PackageDist {
    pub integrity: String,
    pub shasum: String,
    pub tarball: String,
    pub file_count: i64,
    pub unpacked_size: i64,
}

#[derive(Default, Debug, Clone, Serialize, Deserialize)]
struct PackageInfo {
    pub name: String,
    pub version: String,
    pub sources: Option<Vec<web::Source>>,
    pub dist: PackageDist,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct BuildFile {
    pub index: i64,
    pub id: String,
    pub version: String,
    pub official_version: String,
    pub pick_count: i64,
    pub win_rate: String,
    pub timestamp: i64,
    pub alias: String,
    pub name: String,
    pub position: String,
    pub skills: Option<Vec<String>>,
    pub spells: Option<Vec<String>>,
    pub item_builds: Vec<ItemBuild>,
    pub runes: Vec<Rune>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct ItemBuild {
    pub title: String,
    pub associated_maps: Vec<i64>,
    pub associated_champions: Vec<i64>,
    pub blocks: Vec<Block>,
    pub map: String,
    pub mode: String,
    pub preferred_item_slots: Option<Vec<Value>>,
    pub sortrank: i64,
    pub started_from: String,
    #[serde(rename = "type")]
    pub type_field: Option<String>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Block {
    #[serde(rename = "type")]
    pub type_field: String,
    pub items: Option<Vec<Item>>,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Item {
    pub id: String,
    pub count: u8,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct Rune {
    pub alias: String,
    pub name: String,
    pub position: String,
    pub pick_count: i64,
    pub win_rate: String,
    pub primary_style_id: i64,
    pub sub_style_id: i64,
    pub selected_perk_ids: Vec<i64>,
    pub score: Option<f64>,
    #[serde(rename = "type", default = "empty_rune_type")]
    pub type_field: String,
}

#[derive(Default, Debug, Clone, PartialEq, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct PackageJson {
    pub name: String,
    pub version: String,
    pub source_version: String,
    pub description: String,
    pub main: String,
    pub author: String,
    pub license: String,
}

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
    fs::create_dir_all(prefix).unwrap();

    let mut f = fs::File::create(&path)?;
    let buf = serde_json::to_string(&data)?;
    f.write_all(buf[..].as_bytes())?;
    Ok(())
}

pub async fn apply_builds(
    sources: &Vec<String>,
    dir: &String,
    keep_old: bool,
    window: Option<&tauri::Window>,
) -> anyhow::Result<Vec<(bool, String, String)>> {
    let dir_path = std::path::Path::new(&dir);
    println!("dir: {:?}", dir_path);
    let path_exists = dir_path.exists();
    if path_exists && !keep_old {
        tokio::fs::remove_dir_all(dir.clone()).await?;
        println!("[builds] emptied dir: {}", dir);
        if let Some(w) = window {
            let _ = w.emit(
                "apply_build_result",
                vec!["emptied_lol_builds_dir".to_string(), make_id()],
            );
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
                if data.is_empty() {
                    tx.send((false, source.clone(), champ_name.clone()))
                        .unwrap();
                    if let Some(w) = window {
                        let _ = w.emit(
                            "apply_build_result",
                            (false, source.clone(), champ_name.clone(), make_id()),
                        );
                    }
                    println!("apply failed: {} {}", &source, &champ_name);
                }

                for (idx, i) in data.iter().enumerate() {
                    for (iidx, build) in i.item_builds.iter().enumerate() {
                        if let Some(w) = window {
                            let _ = w.emit(
                                "apply_build_result",
                                (
                                    "ready_to_fetch".to_string(),
                                    source.clone(),
                                    champ_name.clone(),
                                    make_id(),
                                ),
                            );
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
            let _ = w.emit("apply_build_result", ("finished", make_id()));
        }
        _ => {
            println!("window not defined, skipped emitting.");
        }
    }
    Ok(results)
}

pub fn spawn_apply_task(
    sources: &Vec<String>,
    dir: &String,
    keep_old: bool,
    window: &tauri::Window,
) {
    let w = window.clone();
    let sources = sources.clone();
    let dir = dir.clone();

    async_std::task::spawn(async move {
        let _ = apply_builds(&sources, &dir, keep_old, Some(&w)).await;
    });
}

pub async fn fetch_source_list() -> anyhow::Result<Vec<web::Source>> {
    let body = reqwest::get(SOURCE_LIST_URL)
        .await?
        .json::<PackageInfo>()
        .await?;
    let sources = body.sources.unwrap_or_default();
    Ok(sources)
}

// https://users.rust-lang.org/t/unzip-reqwest-body-as-a-stream/56409/2
// https://users.rust-lang.org/t/how-to-stream-async-reqwest-response-to-gzdecoder/74367/2
pub async fn download_tarball(source_name: &String) -> anyhow::Result<()> {
    let info = reqwest::get(format!(
        "https://mirrors.cloud.tencent.com/npm/@champ-r/{source_name}/latest"
    ))
    .await?
    .json::<PackageInfo>()
    .await?;
    let resp = reqwest::get(info.dist.tarball).await?;
    let reader = resp
        .bytes_stream()
        .map_err(|e| io::Error::new(ErrorKind::Other, e))
        .into_async_read();
    let mut decoder = GzipDecoder::new(BufReader::new(reader));
    let mut data = vec![];
    decoder.read_to_end(&mut data).await?;
    let file = Cursor::new(data);
    let mut archive = Archive::new(file);
    archive.unpack(format!(".npm/{source_name}"))?;

    Ok(())
}

pub async fn apply_builds_from_local(
    source_name: &String,
    target_folder: &String,
    is_tencent: bool,
    sort: u8,
    app_handle: Option<&AppHandle>,
) -> anyhow::Result<()> {
    let updated = update_tarball_if_not_latest(source_name).await?;
    if let Some(h) = app_handle {
        window::emit_apply_builds_msg(
            h,
            source_name,
            &format!("[{source_name}] Start"),
            false,
            true,
        );

        if updated {
            window::emit_apply_builds_msg(
                h,
                source_name,
                &format!("[{source_name}] Updated tarball"),
                false,
                true,
            );
        }
    }

    let source_folder = format!(".npm/{source_name}/package");
    let paths = fs::read_dir(&source_folder).unwrap();
    let mut build_files = vec![];
    for entry in paths {
        let entry = entry?;
        let p = entry.path().into_os_string().into_string().unwrap();
        if p.contains("package.json") || p.contains("index.json") {
            continue;
        }

        let file = fs::read_to_string(&p)
            .expect("[builds::apply_builds_from_local] failed to read build file");
        let b: Vec<BuildFile> = serde_json::from_str(&file)
            .expect("[builds::apply_builds_from_local] failed to parse build file");
        build_files.push(b);
    }

    let source_name_in_path = source_name.replace(".", "_");
    for builds in build_files {
        let mut alias = &String::new();

        for (idx, b) in builds.iter().enumerate() {
            alias = &b.alias;
            let dir = if is_tencent {
                format!("{target_folder}/Game/Config/Champions/{alias}/Recommended")
            } else {
                format!("{target_folder}/Config/Champions/{alias}/Recommended")
            };
            let pos = &b.position;
            fs::create_dir_all(&dir)?;

            for (iidx, item) in b.item_builds.iter().enumerate() {
                let full_path =
                    format!("{dir}/{sort}_{source_name_in_path}_{alias}_{pos}_{idx}_{iidx}.json");
                if Path::new(&full_path).exists() {
                    let _ = fs::remove_file(&full_path);
                    let _ = fs::remove_dir_all(&full_path);
                }

                let mut f = fs::File::create(&full_path)?;
                let buf = serde_json::to_string_pretty(&item)?;
                f.write_all(buf[..].as_bytes())?;
                println!("[builds::apply_builds_from_local] saved to: {}", &full_path);
            }
        }

        if let Some(h) = app_handle {
            let msg = format!("[{source_name}] Applied builds for {alias}");
            window::emit_apply_builds_msg(h, source_name, &msg, false, true);
        }
    }

    if let Some(h) = app_handle {
        window::emit_apply_builds_msg(h, source_name, &String::new(), true, false);
    }

    Ok(())
}

pub async fn update_tarball_if_not_latest(source_name: &String) -> anyhow::Result<bool> {
    let remote_source_url =
        format!("https://mirrors.cloud.tencent.com/npm/@champ-r/{source_name}/latest");
    let pkg = reqwest::get(remote_source_url)
        .await?
        .json::<PackageInfo>()
        .await?;
    let remote_version = pkg.version;

    let mut should_download = true;
    let source_folder = format!(".npm/{source_name}/package");
    let pkg_json = format!("{source_folder}/package.json");
    let path = std::path::Path::new(&pkg_json);
    if path.exists() {
        let local_file = fs::read_to_string(path).expect("Unable to read package.json");
        let p: PackageJson = serde_json::from_str(&local_file).expect("Unable to parse");
        if p.version.eq(&remote_version) {
            should_download = false
        }
    }
    if should_download {
        println!(
            "[builds::update_tarball_if_not_latest] should update local package `{source_name}`"
        );
        download_tarball(source_name).await?;
        println!("[builds::update_tarball_if_not_latest] updated package `{source_name}`");
    }

    Ok(should_download)
}

pub async fn load_runes(
    source_name: &String,
    champion_alias: &String,
) -> anyhow::Result<Vec<Rune>> {
    if source_name.is_empty() || champion_alias.is_empty() {
        return Err(anyhow!(
            "[builds] invalid source `{source_name}` or champion `{champion_alias}`"
        ));
    }
    update_tarball_if_not_latest(source_name).await?;
    let source_folder = format!(".npm/{source_name}/package");
    let file_path = format!("{source_folder}/{champion_alias}.json");
    let f = fs::read_to_string(&file_path).expect("read build file failed");
    let builds: Vec<BuildFile> = serde_json::from_str(&f).expect("Unable to parse build file");

    let mut runes: Vec<Rune> = vec![];
    for b in builds {
        runes = [runes, b.runes].concat();
    }

    Ok(runes)
}

pub fn empty_lol_build_dir(dir: &String, _is_tencent: bool, win: &Option<Window>) {
    let dir = format!("{dir}/Game/Config/Champions/");
    let dir_path = Path::new(&dir);
    let path_exists = dir_path.exists();

    if path_exists {
        match fs::remove_dir_all(dir_path) {
            Ok(_) => {
                println!("[builds::empty_lol_build_dir] emptied dir: {}", dir);
            }
            Err(e) => {
                println!("[builds::empty_lol_build_dir::empty_dir]{:?}", e);
            }
        };

        if let Some(w) = win {
            let _ = w.emit(
                "apply_build_result",
                vec!["emptied_lol_builds_dir".to_string(), make_id()],
            );
        }
    } else {
        println!("[builds::empty_lol_build_dir] {dir} does not exist, perform create action");
        let _ = fs::create_dir(dir_path);
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[tokio::test]
    async fn download() -> anyhow::Result<()> {
        let target = String::from(".cdn_files");
        let sources = fetch_source_list().await?;
        let s = &sources.first().unwrap().value;
        println!("applying builds from `{s}`");
        apply_builds_from_local(s, &target, false, 1, None).await?;
        Ok(())
    }

    #[tokio::test]
    async fn show_runes() -> anyhow::Result<()> {
        let source = String::from("u.gg");
        let champ = String::from("Rengar");
        let runes = load_runes(&source, &champ).await?;
        println!("{:?}", runes);
        Ok(())
    }

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

        match apply_builds(&sources, &folder, keep_old, None).await {
            Ok(_) => {
                println!("all set");
            }
            Err(e) => {
                println!("{:?}", e);
            }
        }
    }
}
