import { ipcRenderer, contextBridge, shell } from 'electron';
import log from 'electron-log';
import cheerio from 'cheerio';

import { appConfig } from './utils/config';
import * as file from './utils/file';
import { LanguageList, LanguageSet } from './constants/langs';

export const bridge = {
  sendMessage: (channel: string, data?: any) => {
    ipcRenderer.send(channel, data);
  },
  invoke: async (channel: string, data?: any) => {
    return await ipcRenderer.invoke(channel, data);
  },
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  },
  once: (channel: string, callback: Function) => {
    ipcRenderer.once(channel, (_, data) => callback(data));
  },
  removeListener: (channel: string, cb: any) => {
    ipcRenderer.removeListener(channel, cb);
  },

  console: log,
  file,
  cheerio,
  appConfig: {
    get(key: string, fallbackVal?: any) {
      return appConfig.get(key, fallbackVal);
    },
    set(key: string, obj: any) {
      return appConfig.set(key, obj);
    },
  },

  LanguageList,
  LanguageSet,
};

contextBridge.exposeInMainWorld('bridge', bridge);
contextBridge.exposeInMainWorld('shell', shell);
