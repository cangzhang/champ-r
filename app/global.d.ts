import { bridge } from './preload';
import { appConfig } from './config';

import ipcRenderer = Electron.Renderer.ipcRenderer;
import shell = Electron.shell;

declare global {
  interface Window {
    bridge: typeof bridge;
    ipcRenderer: typeof ipcRenderer;
    shell: typeof shell;
    appConfig: typeof appConfig;
  }
}
