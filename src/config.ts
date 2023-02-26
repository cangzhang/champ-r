import { Store } from 'tauri-plugin-store-api';

const appConf = new Store('.settings');

export { appConf };
