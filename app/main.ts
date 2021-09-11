import path from 'path';
import _debounce from 'lodash/debounce';

import osLocale from 'os-locale';
import { machineId } from 'node-machine-id';
import { app, BrowserWindow, Menu, ipcMain, screen, Tray, nativeImage, nativeTheme, IpcMainEvent } from 'electron';
import { autoUpdater } from 'electron-updater';
import contextMenu from 'electron-context-menu';
import unhandled from 'electron-unhandled';
import debug from 'electron-debug';
import electronLogger from 'electron-log';
import { initialize as initRemoteMain } from '@electron/remote/dist/src/main';

import initLogger from '../src/native/logger';
import appStore from '../src/native/config';
import { LanguageList, LanguageSet } from '../src/native/langs';
import { ifIsCNServer } from './utils';

interface IPopupEventData {
  championId: string;
  position: string;
}

const isMac = process.platform === 'darwin';
const isDev = process.env.IS_DEV_MODE === `true`;

initRemoteMain();

try {
  if (isDev) {
    require('electron-reloader')(module, {
      watchRenderer: false,
      ignore: [
        './src/**/*',
      ],
    });
  }
} catch (_) {
}

initLogger();

unhandled({
  showDialog: false,
});
debug({
  showDevTools: false,
});
contextMenu();

nativeTheme.themeSource = `light`;
// Note: Must match `build.appId` in package.json
app.setAppUserModelId('com.al.champ-r');
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.allowRendererProcessReuse = false;

const ignoreSystemScale = appStore.get(`ignoreSystemScale`);
if (ignoreSystemScale) {
  app.commandLine.appendSwitch('high-dpi-support', `1`);
  app.commandLine.appendSwitch('force-device-scale-factor', `1`);
}

// Prevent window from being garbage collected
let mainWindow: BrowserWindow | null;
let popupWindow: BrowserWindow | null;
let tray = null;

const webPreferences = {
  nodeIntegration: true,
  contextIsolation: false,
  webSecurity: false,
  allowRunningInsecureContent: true,
  zoomFactor: 1,
  enableRemoteModule: true,
};

const createMainWindow = async () => {
  const win = new BrowserWindow({
    title: app.name,
    center: true,
    show: false,
    frame: false,
    height: 650,
    width: 400,
    resizable: isDev || ignoreSystemScale,
    webPreferences,
  });

  win.on('ready-to-show', () => {
    win.show();
  });

  win.on('closed', () => {
    // Dereference the window
    // For multiple windows store them in an array
    mainWindow = null;
    popupWindow = null;
  });

  await win.loadURL(
    isDev ? 'http://127.0.0.1:3000' : `file://${path.join(__dirname, '../index.html')}`,
  );

  return win;
};

const createPopupWindow = async () => {
  const [mX, mY] = mainWindow!.getPosition();
  const curDisplay = screen.getDisplayNearestPoint({
    x: mX,
    y: mY,
  });

  const popupConfig = appStore.get(`popup`);
  const popup = new BrowserWindow({
    show: false,
    frame: false,
    resizable: true,
    fullscreenable: false,

    skipTaskbar: popupConfig.alwaysOnTop,
    alwaysOnTop: popupConfig.alwaysOnTop,
    width: popupConfig.width || 300,
    height: popupConfig.height || 350,
    x:
      popupConfig.x ||
      (isDev ? curDisplay.bounds.width / 2 : curDisplay.bounds.width - 500 - 140),
    y: popupConfig.y || curDisplay.bounds.height / 2,
    webPreferences,
  });

  popup.on(`move`, _debounce(() => persistPopUpBounds(popup), 1000));

  popup.on(`resize`, _debounce(() => persistPopUpBounds(popup), 1000));

  popup.on('closed', () => {
    popupWindow = null;
  });

  await popup.loadURL(
    isDev
      ? `http://127.0.0.1:3000/popup.html`
      : `file://${path.join(__dirname, '../popup.html')}`,
  );

  return popup;
};

// Prevent multiple instances of the app
if (!app.requestSingleInstanceLock()) {
  app.quit();
}

app.on('second-instance', () => {
  if (mainWindow) {
    if (mainWindow.isMinimized()) {
      mainWindow.restore();
    }

    mainWindow.show();
  }
});

app.on(`quit`, () => {
  mainWindow = null;
  popupWindow = null;
});

app.on('window-all-closed', () => {
  if (!isMac) {
    app.quit();
  }
});

app.on('activate', async () => {
  if (!mainWindow) {
    mainWindow = await createMainWindow();
  }
});

function persistPopUpBounds(w: BrowserWindow) {
  if (!w) {
    return;
  }

  const { x, y, width, height } = w.getBounds();
  appStore.set(`popup.x`, x);
  appStore.set(`popup.y`, y);
  appStore.set(`popup.width`, width);
  appStore.set(`popup.height`, height);
}

let lastChampion = ``;

function onShowPopup() {
  return async (_ev: IpcMainEvent, data: IPopupEventData) => {
    if (!data.championId || lastChampion === data.championId) {
      return;
    }

    lastChampion = data.championId;
    if (!popupWindow) {
      popupWindow = await createPopupWindow();
    }

    // popupWindow.setAlwaysOnTop(true);
    popupWindow.show();
    // popupWindow.setAlwaysOnTop(false);
    // app.focus();
    popupWindow.focus();

    const task = setInterval(() => {
      if (!popupWindow!.isVisible()) {
        return;
      }

      popupWindow!.webContents.send(`for-popup`, {
        championId: data.championId,
        position: data.position,
      });
      clearInterval(task);
    }, 300);
  };
}

function registerMainListeners() {
  ipcMain.on(`broadcast`, (ev, data) => {
    ev.sender.send(data.channel, data);
  });

  ipcMain.on(`show-popup`, onShowPopup());

  ipcMain.on(`hide-popup`, async () => {
    if (popupWindow) {
      lastChampion = ``;
      const isVisible = popupWindow.isVisible();
      if (isVisible) {
        popupWindow.hide();
      }
    }
  });

  ipcMain.on(`toggle-main-window`, () => {
    toggleMainWindow();
  });

  ipcMain.on(`restart-app`, () => {
    app.relaunch();
    app.exit();
  });

  ipcMain.on(`popup:toggle-always-on-top`, () => {
    if (!popupWindow) return;

    const next = !popupWindow.isAlwaysOnTop();
    popupWindow.setAlwaysOnTop(next);
    popupWindow.setSkipTaskbar(next);

    appStore.set(`popup.alwaysOnTop`, next);
  });

  ipcMain.on(`popup:reset-position`, () => {
    const [mx, my] = mainWindow!.getPosition();
    const { bounds } = screen.getDisplayNearestPoint({ x: mx, y: my });
    const [x, y] = [bounds.width / 2, bounds.height / 2];

    appStore.set(`popup.alwaysOnTop`, true);
    appStore.set(`popup.x`, x);
    appStore.set(`popup.y`, y);

    if (!popupWindow) {
      return;
    }

    popupWindow.setAlwaysOnTop(true);
    popupWindow.setPosition(x, y);
  });

  ipcMain.on(`app-sha`, (_ev, data) => {
    console.info(`app sha is ${data.sha}`);
  });

  ipcMain.on(`updateLolDir`, async (_ev, { lolDir }) => {
    console.info(`lolDir is ${lolDir}`);
    appStore.set(`lolDir`, lolDir);
    if (!lolDir) {
      return;
    }

    await ifIsCNServer(lolDir);
  });
}

function toggleMainWindow() {
  if (!mainWindow) {
    return;
  }

  const visible = mainWindow.isVisible();
  if (!visible) {
    mainWindow.show();
    mainWindow.setSkipTaskbar(false);
  } else {
    mainWindow.hide();
    mainWindow.setSkipTaskbar(true);
  }
}

function makeTray() {
  const iconPath = path.join(isDev ? `${__dirname}/../../` : process.resourcesPath, 'resources/app-icon.png');
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 24, height: 24 });

  tray = new Tray(icon);
  // tray.setIgnoreDoubleClickEvents(true)
  tray.setToolTip('ChampR');
  tray.on(`click`, () => {
    toggleMainWindow();
  });
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Toggle window`,
      click() {
        toggleMainWindow();
      },
    },
    {
      label: `Exit`,
      click() {
        app.quit();
      },
    },
  ]);
  tray.setContextMenu(contextMenu);
}

async function getMachineId() {
  const userId = appStore.get(`userId`);
  if (userId) return userId;

  const id = await machineId();
  appStore.set(`userId`, id);
  return id;
}

function isNetworkError(errorObject: Error) {
  return errorObject.message.includes(`net::ERR_`);
  // errorObject.message === 'net::ERR_INTERNET_DISCONNECTED' ||
  // errorObject.message === 'net::ERR_PROXY_CONNECTION_FAILED' ||
  // errorObject.message === 'net::ERR_CONNECTION_RESET' ||
  // errorObject.message === 'net::ERR_CONNECTION_CLOSE' ||
  // errorObject.message === 'net::ERR_NAME_NOT_RESOLVED' ||
  // errorObject.message === 'net::ERR_CONNECTION_TIMED_OUT' ||
  // errorObject.message === 'net::ERR_EMPTY_RESPONSE'
}

async function checkUpdates() {
  if (isDev) {
    console.log(`Skipped updated check for dev mode.`);
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

function registerUpdater() {
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

(async () => {
  console.log(`ChampR starting, app version ${app.getVersion()}.`);

  await app.whenReady();
  Menu.setApplicationMenu(null);

  const locale = (await osLocale()) || LanguageSet.enUS;
  const sysLang = appStore.get(`appLang`);
  const lolDir = appStore.get(`lolDir`);
  if (!sysLang || !LanguageList.includes(locale)) {
    appStore.set(`appLang`, LanguageSet.enUS);
  }
  console.log(`locale: ${sysLang}, sys lang: ${sysLang}`);

  mainWindow = await createMainWindow();
  popupWindow = await createPopupWindow();

  registerMainListeners();
  registerUpdater();
  ifIsCNServer(lolDir);

  await makeTray();
  const userId = await getMachineId();

  console.log(`userId: ${userId}`);
  await checkUpdates();
})();
