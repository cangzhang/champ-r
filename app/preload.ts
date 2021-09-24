import { ipcRenderer, contextBridge, shell } from 'electron';
import log from 'electron-log';
import cheerio from 'cheerio';

import { appConfig } from './config';
import * as file from './file';
import { LanguageList, LanguageSet } from './langs';

export const bridge = {
  sendMessage: (channel: string, data?: any) => {
    ipcRenderer.send(channel, data);
  },
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
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
