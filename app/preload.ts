import { ipcRenderer, contextBridge } from 'electron';
import log from 'electron-log';

export const api = {
  sendMessage: (message: any) => {
    ipcRenderer.send('message', message);
  },
  on: (channel: string, callback: Function) => {
    ipcRenderer.on(channel, (_, data) => callback(data));
  },
  console: log,
};

contextBridge.exposeInMainWorld('Main', api);
contextBridge.exposeInMainWorld('ipcRenderer', ipcRenderer);
