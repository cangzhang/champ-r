use eframe::egui::{
    self,
    ahash::HashMap,
    load::{Bytes, BytesLoadResult, BytesLoader, BytesPoll, LoadError},
    mutex::Mutex,
};
use std::{sync::Arc, task::Poll};

use crate::ureq_agent::insecure_agent;

#[derive(Clone, Debug)]
struct File {
    bytes: Arc<[u8]>,
    mime: Option<String>,
}

impl File {
    fn from_response(_uri: &str, response: ureq::Response) -> Result<Self, String> {
        let mime = Some(response.content_type().to_string());
        let mut bytes: Vec<u8> = vec![];
        response.into_reader().read_to_end(&mut bytes).unwrap();
        Ok(File {
            bytes: Arc::from(bytes),
            mime,
        })
    }
}

type Entry = Poll<Result<File, String>>;

#[derive(Default)]
pub struct AssetLoader {
    cache: Arc<Mutex<HashMap<String, Entry>>>,
}

impl AssetLoader {
    pub const ID: &'static str = egui::generate_loader_id!(AssetLoader);
}

const PROTOCOLS: &[&str] = &["lcu-https://"];

fn starts_with_one_of(s: &str, prefixes: &[&str]) -> bool {
    prefixes.iter().any(|prefix| s.starts_with(prefix))
}

fn get_asset_id(uri: &str) -> String {
    let parts: Vec<&str> = uri.split('/').collect();

    // Skip the first 3 segments and rejoin the rest
    let id = parts.iter().skip(3).fold(String::new(), |acc, &part| {
        if acc.is_empty() {
            part.to_string()
        } else {
            acc + "/" + part
        }
    });

    id
}

impl BytesLoader for AssetLoader {
    fn id(&self) -> &str {
        Self::ID
    }

    fn load(&self, ctx: &egui::Context, raw_uri: &str) -> BytesLoadResult {
        if !starts_with_one_of(raw_uri, PROTOCOLS) {
            return Err(LoadError::NotSupported);
        }

        let uri = raw_uri.strip_prefix("lcu-").unwrap().to_string();

        let asset_id = get_asset_id(&uri);
        let mut cache = self.cache.lock();

        if let Some(entry) = cache.get(&asset_id).cloned() {
            match entry {
                Poll::Ready(Ok(file)) => Ok(BytesPoll::Ready {
                    size: None,
                    bytes: Bytes::Shared(file.bytes),
                    mime: file.mime,
                }),
                Poll::Ready(Err(err)) => Err(LoadError::Loading(err)),
                Poll::Pending => Ok(BytesPoll::Pending { size: None }),
            }
        } else {
            cache.insert(asset_id.clone(), Poll::Pending);
            let result = match insecure_agent().get(&uri).call() {
                Ok(response) => File::from_response(&uri, response),
                Err(_) => Err(format!("Failed to load {uri:?}")),
            };
            cache.insert(asset_id.clone(), Poll::Ready(result));
            ctx.request_repaint();

            Ok(BytesPoll::Pending { size: None })
        }
    }

    fn forget(&self, uri: &str) {
        let _ = self.cache.lock().remove(uri);
    }

    fn forget_all(&self) {
        self.cache.lock().clear();
    }

    fn byte_size(&self) -> usize {
        self.cache
            .lock()
            .values()
            .map(|entry| match entry {
                Poll::Ready(Ok(file)) => {
                    file.bytes.len() + file.mime.as_ref().map_or(0, |m| m.len())
                }
                Poll::Ready(Err(err)) => err.len(),
                _ => 0,
            })
            .sum()
    }
}
