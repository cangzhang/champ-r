import { autoUpdater } from 'electron-updater';
import electronLogger from 'electron-log';
import { ipcMain } from 'electron';

import { isDev } from './service';
import BrowserWindow = Electron.BrowserWindow;

export function isNetworkError(errorObject: Error) {
  return errorObject.message.includes(`net::ERR_`);
  // errorObject.message === 'net::ERR_INTERNET_DISCONNECTED' ||
  // errorObject.message === 'net::ERR_PROXY_CONNECTION_FAILED' ||
  // errorObject.message === 'net::ERR_CONNECTION_RESET' ||
  // errorObject.message === 'net::ERR_CONNECTION_CLOSE' ||
  // errorObject.message === 'net::ERR_NAME_NOT_RESOLVED' ||
  // errorObject.message === 'net::ERR_CONNECTION_TIMED_OUT' ||
  // errorObject.message === 'net::ERR_EMPTY_RESPONSE'
}

export async function checkUpdates() {
  if (isDev) {
    console.log(`[updater] skipped updated check, it's dev mode`);
    return;
  }

  try {
    setInterval(async () => {
      await autoUpdater.checkForUpdates();
    }, 1000 * 60 * 60 * 4);

    await autoUpdater.checkForUpdates();
  } catch (err) {
    if (isNetworkError(err)) {
      console.error('Network Error');
      return;
    }

    console.error(err == null ? 'unknown' : (err.stack || err).toString());
  }
}

export function registerUpdater(mainWindow: BrowserWindow) {
  electronLogger.transports.file.level = 'info';
  autoUpdater.logger = electronLogger;
  autoUpdater.autoDownload = false;

  autoUpdater.on('checking-for-update', () => {
    console.log(`Checking update...`);
  });

  autoUpdater.on('update-available', (info) => {
    console.log(`${info.version}`);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send(`update-available`, info);
    }
  });

  autoUpdater.on('update-not-available', (info) => {
    console.error(`Update not available: ${info.version}`);
  });

  autoUpdater.on(`update-downloaded`, (info) => {
    console.info(`Update downloaded: ${info.version}`);
    if (mainWindow && mainWindow.webContents) {
      mainWindow.webContents.send(`update-downloaded`, info);
    }
  });

  autoUpdater.on('error', (err) => {
    console.error('Error in auto-updater. ' + err);
  });

  ipcMain.on(`install-update`, () => {
    autoUpdater.quitAndInstall(false);
  });
}
