try {
  require('electron-reloader')(module);
} catch (_) {}

require('./src/native/logger');

const path = require('path');
const osLocale = require('os-locale');
const { machineId } = require('node-machine-id');
const { app, BrowserWindow, Menu, ipcMain, screen, Tray, nativeImage } = require('electron');
const { autoUpdater } = require('electron-updater');
const { is, centerWindow } = require('electron-util');
const contextMenu = require('electron-context-menu');

const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const isDev = require('electron-is-dev');

const config = require('./src/native/config');

unhandled();
debug();
contextMenu();

// Note: Must match `build.appId` in package.json
app.setAppUserModelId('com.al.champ-r');
app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.commandLine.appendSwitch('disable-features', 'OutOfBlinkCors');
app.allowRendererProcessReuse = false;

const ignoreSystemScale = config.get(`ignoreSystemScale`);
if (ignoreSystemScale) {
  app.commandLine.appendSwitch('high-dpi-support', 1);
  app.commandLine.appendSwitch('force-device-scale-factor', 1);
}

// Prevent window from being garbage collected
let mainWindow = null;
let popupWindow = null;
let tray = null;

const webPreferences = {
  nodeIntegration: true,
  webSecurity: false,
  allowRunningInsecureContent: true,
  zoomFactor: 1,
};

const createMainWindow = async () => {
  const win = new BrowserWindow({
    title: app.name,
    show: false,
    frame: false,
    height: 650,
    width: isDev ? 1300 : 400,
    resizable: isDev || ignoreSystemScale,
    webPreferences,
  });

  win.on('ready-to-show', () => {
    win.show();
  });

  win.on('closed', () => {
    // Dereference the window
    // For multiple windows store them in an array
    mainWindow = undefined;
    popupWindow = undefined;
  });

  await win.loadURL(
    isDev ? 'http://127.0.0.1:3000' : `file://${path.join(__dirname, 'build/index.html')}`,
  );

  return win;
};

const createPopupWindow = async () => {
  const [mX, mY] = mainWindow.getPosition();
  const curDisplay = screen.getDisplayNearestPoint({
    x: mX,
    y: mY,
  });

  const popup = new BrowserWindow({
    show: false,
    frame: false,
    skipTaskbar: true,
    resizable: isDev || ignoreSystemScale,
    fullscreenable: false,
    alwaysOnTop: !isDev,
    width: config.get(`popup.width`) || 300,
    height: config.get(`popup.height`) || 350,
    x:
      config.get(`popup.x`) ||
      (isDev ? curDisplay.bounds.width / 2 : curDisplay.bounds.width - 500 - 140),
    y: config.get(`popup.y`) || curDisplay.bounds.height / 2,
    webPreferences,
  });

  // popup.on(`ready-to-show`, () => {
  //   popup.show();
  // });

  popup.on(`move`, () => {
    persistPopUpBounds(popup);
  });

  popup.on(`resize`, () => {
    persistPopUpBounds(popup);
  });

  popup.on('closed', () => {
    popupWindow = undefined;
  });

  await popup.loadURL(
    isDev
      ? `http://127.0.0.1:3000/popup.html`
      : `file://${path.join(__dirname, 'build/popup.html')}`,
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
  mainWindow = undefined;
  popupWindow = undefined;
});

app.on('window-all-closed', () => {
  if (!is.macos) {
    app.quit();
  }
});

app.on('activate', async () => {
  if (!mainWindow) {
    mainWindow = await createMainWindow();
  }
});

function persistPopUpBounds(w) {
  if (!w) {
    return;
  }

  const { x, y, width, height } = w.getBounds();
  config.set(`popup.x`, x);
  config.set(`popup.y`, y);
  config.set(`popup.width`, width);
  config.set(`popup.height`, height);
}

function registerMainListeners() {
  ipcMain.on(`broadcast`, (ev, data) => {
    ev.sender.send(data.channel, data);
  });

  ipcMain.on(`show-popup`, async (ev, data) => {
    if (!popupWindow) {
      popupWindow = await createPopupWindow();
    }

    if (!popupWindow.isVisible()) {
      popupWindow.show();
    }

    popupWindow.webContents.send(`for-popup`, {
      championId: data.championId,
      position: data.position,
    });
  });

  ipcMain.on(`hide-popup`, async () => {
    if (popupWindow) {
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
  const iconPath = path.join(isDev ? __dirname : process.resourcesPath, 'resources/app-icon.png');
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
  const userId = config.get(`userId`);
  if (userId) return userId;

  const id = await machineId();
  config.set(`userId`, id);
  return id;
}

function isNetworkError(errorObject) {
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
  autoUpdater.logger = require('electron-log');
  autoUpdater.logger.transports.file.level = 'info';
  autoUpdater.autoDownload = false;

  autoUpdater.on('checking-for-update', () => {
    console.log(`Checking update...`);
  });

  autoUpdater.on('update-available', (info) => {
    console.log(`Update available: ${info.version}`);
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
  console.log(`ChampR starting...`);

  await app.whenReady();
  Menu.setApplicationMenu(null);

  const locale = (await osLocale()) || `en-US`;
  const sysLang = config.get(`appLang`);
  if (!sysLang || ![`en-US`, `zh-CN`].includes(locale)) {
    config.set(`appLang`, `en-US`);
  }
  console.log(`locale: ${sysLang}, sys lang: ${sysLang}`);

  mainWindow = await createMainWindow();
  popupWindow = await createPopupWindow();

  registerMainListeners();
  registerUpdater();

  await centerWindow({
    window: mainWindow,
    animated: true,
  });

  await makeTray();
  const userId = await getMachineId();
  console.log(`userId: ${userId}`);

  await checkUpdates();
})();
