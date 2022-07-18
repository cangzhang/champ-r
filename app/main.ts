import path from 'path';
import debounce from 'lodash/debounce';
import osLocale from 'os-locale';

import { app, BrowserWindow, Menu, nativeTheme, screen, Tray } from 'electron';
import contextMenu from 'electron-context-menu';
import unhandled from 'electron-unhandled';
import debug from 'electron-debug';

import { IChampionMap, IPopupEventData } from '@interfaces/commonTypes';
import { initLogger } from './utils/logger';
import { appConfig } from './utils/config';
import { LcuWatcher } from './utils/lcu';
import { LanguageList, LanguageSet } from './constants/langs';
import { LcuEvent } from './constants/events';
import { LcuWsClient } from './utils/ws';
import { hasPwsh } from './utils/cmd';
import { getChampionList, getMachineId, isDev } from './utils';
import { registerMainListeners } from './listeners';
import { makeTray } from './tray';
import { checkUpdates, registerUpdater } from './updater';

const isMac = process.platform === 'darwin';
initLogger();

unhandled({
  showDialog: false,
});
debug({
  showDevTools: false,
});
contextMenu();

process.env[`NODE_TLS_REJECT_UNAUTHORIZED`] = `0`;
nativeTheme.themeSource = `light`;
// Note: Must match `build.appId` in package.json
app.setAppUserModelId('com.al.champ-r');
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');

const ignoreSystemScale = appConfig.get(`ignoreSystemScale`);
if (ignoreSystemScale) {
  app.commandLine.appendSwitch('high-dpi-support', `1`);
  app.commandLine.appendSwitch('force-device-scale-factor', `1`);
}

// Prevent window from being garbage collected
let mainWindow: BrowserWindow | null;
let popupWindow: BrowserWindow | null;
let tray: Tray | null = null;
let lcuWatcher: LcuWatcher | null = null;

const webPreferences = {
  webSecurity: false,
  nodeIntegration: true,
  contextIsolation: true,
  enableRemoteModule: true,
  allowRunningInsecureContent: true,
  zoomFactor: 1,
  preload: path.join(__dirname, 'preload.js'),
};

export async function createMainWindow() {
  const startMinimized = appConfig.get(`startMinimized`, false);

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
    if (startMinimized) {
      console.log(`started ChampR minimized`);
      win.setSkipTaskbar(true);
      return;
    }

    win.show();
  });

  win.on('closed', () => {
    // Dereference the window
    // For multiple windows, store them in an array
    mainWindow = null;
    popupWindow = null;
  });

  await win.loadURL(
    isDev ? 'http://127.0.0.1:3000' : `file://${path.join(__dirname, 'index.html')}`,
  );

  return win;
}

export async function createPopupWindow() {
  const [mX, mY] = mainWindow!.getPosition();
  const curDisplay = screen.getDisplayNearestPoint({
    x: mX,
    y: mY,
  });

  const popupConfig = appConfig.get(`popup`);
  const popup = new BrowserWindow({
    show: false,
    frame: false,
    resizable: true,
    fullscreenable: false,

    skipTaskbar: popupConfig.alwaysOnTop,
    alwaysOnTop: popupConfig.alwaysOnTop,
    width: popupConfig.width || 300,
    height: popupConfig.height || 350,
    x: popupConfig.x || (isDev ? curDisplay.bounds.width / 2 : curDisplay.bounds.width - 500 - 140),
    y: popupConfig.y || curDisplay.bounds.height / 2,
    webPreferences,
  });

  popup.on(
    `move`,
    debounce(() => persistPopUpBounds(popup), 1000),
  );

  popup.on(
    `resize`,
    debounce(() => persistPopUpBounds(popup), 1000),
  );

  popup.on('closed', () => {
    popupWindow = null;
  });

  await popup.loadURL(
    isDev ? `http://127.0.0.1:3000/popup.html` : `file://${path.join(__dirname, 'popup.html')}`,
  );

  return popup;
}

export async function onShowPopup(data: IPopupEventData) {
  if (data.noCache) lastChampion = 0;

  if (!data.championId || lastChampion === data.championId) {
    return;
  }

  lastChampion = data.championId;
  if (!popupWindow) {
    popupWindow = await createPopupWindow();
  }

  // popupWindow.setAlwaysOnTop(true);
  popupWindow?.show();
  // popupWindow.setAlwaysOnTop(false);
  // app.focus();
  popupWindow?.focus();

  const task = setInterval(() => {
    if (!popupWindow!.isVisible()) {
      return;
    }

    popupWindow!.webContents.send(`for-popup`, {
      championId: data.championId,
    });
    clearInterval(task);
  }, 300);
}

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
  appConfig.set(`popup.x`, x);
  appConfig.set(`popup.y`, y);
  appConfig.set(`popup.width`, width);
  appConfig.set(`popup.height`, height);
}

let lastChampion = 0;
let championMap: IChampionMap = {};

(async () => {
  console.log(`ChampR starting, app version ${app.getVersion()}.`);

  await app.whenReady();
  Menu.setApplicationMenu(null);

  let locale = await osLocale();
  let appLang = appConfig.get(`appLang`);
  console.info(`System locale is ${locale}, app lang is ${appLang || 'unset'}`);

  if (!appLang) {
    if (LanguageList.includes(locale)) {
      appConfig.set(`appLang`, locale);
    } else {
      appConfig.set(`appLang`, LanguageSet.enUS);
    }
  }
  const minimized = appConfig.get(`startMinimized`, false);

  const pwsh = await hasPwsh();
  lcuWatcher = new LcuWatcher(pwsh);
  const _lcuWs = new LcuWsClient(lcuWatcher);

  mainWindow = await createMainWindow();
  popupWindow = await createPopupWindow();

  lcuWatcher.addListener(LcuEvent.SelectedChampion, (data: IPopupEventData) => {
    onShowPopup(data);
  });
  lcuWatcher.addListener(LcuEvent.MatchedStartedOrTerminated, () => {
    if (popupWindow) {
      lastChampion = 0;
      const isVisible = popupWindow.isVisible();
      if (isVisible) {
        popupWindow.hide();
      }
    }
  });

  championMap = await getChampionList();
  registerMainListeners(mainWindow, popupWindow, lcuWatcher, championMap);
  registerUpdater(mainWindow);
  await makeTray({ minimized }, tray, mainWindow);

  const userId = await getMachineId();
  console.log(`userId: ${userId}`);
  await checkUpdates();
})();
