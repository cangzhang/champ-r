import { api } from './preload';
import ipcRenderer = Electron.Renderer.ipcRenderer;

declare global {
  interface Window {
    Main: typeof api;
    ipcRenderer: typeof ipcRenderer;
  }
}
