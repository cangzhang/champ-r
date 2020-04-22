try {
  require('electron-reloader')(module);
} catch (_) {
}

const path = require('path');
// const osLocale = require('os-locale');

const { app, BrowserWindow, Menu, ipcMain, screen } = require('electron');
/// const { autoUpdater } = require('electron-updater');
const { is, centerWindow } = require('electron-util');
const contextMenu = require('electron-context-menu');

const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const isDev = require('electron-is-dev');

// const config = require('./src/native/config');
// const { getLolVer, getItemList, getChampions } = require('./src/service/ddragon');

unhandled();
debug();
contextMenu();

// Note: Must match `build.appId` in package.json
app.setAppUserModelId('com.al.champ-r');

app.commandLine.appendSwitch('ignore-certificate-errors', 'true');
app.allowRendererProcessReuse = false;

// Uncomment this before publishing your first version.
// It's commented out as it throws an error if there are no published versions.
// if (!is.development) {
// 	const FOUR_HOURS = 1000 * 60 * 60 * 4;
// 	setInterval(() => {
// 		autoUpdater.checkForUpdates();
// 	}, FOUR_HOURS);
//
// 	autoUpdater.checkForUpdates();
// }

// Prevent window from being garbage collected
let mainWindow;
let popupWindow;

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
    height: 800,
    width: isDev ? 1300 : 500,
    resizable: false,
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
    isDev ?
      'http://127.0.0.1:3000' :
      `file://${path.join(__dirname, 'build/index.html')}`,
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
    // transparent: true,
    width: isDev ? 900 : 450,
    height: 600,
    x: isDev ? curDisplay.bounds.width / 2 : curDisplay.bounds.width - 500 - 140,
    y: curDisplay.bounds.height / 2,
    webPreferences,
  });

  // popup.on(`ready-to-show`, () => {
  //   popup.show();
  // });

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

function registerMainListeners() {
  ipcMain.on(`broadcast`, (ev, data) => {
    ev.sender.send(data.channel, data);
  });

  ipcMain.on(`show-popup`, async (ev, data) => {
    if (!popupWindow) {
      popupWindow = await createPopupWindow();
    }

    if (!popupWindow.isVisible()) {
      // popupWindow.showInactive();
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
}

// async function prepareData() {
//   const lolVer = config.get(`lolVer`);
//   const itemMap = config.get(`itemMap`);
//   const championMap = config.get(`championMap`);
//   let appLang = config.get(`appLang`);
//   if (!appLang) {
//     appLang = osLocale.sync().replace(`-`, `_`);
//   }
//
//   const version = await getLolVer();
//   if (version === lolVer && itemMap && championMap) {
//     return [lolVer, itemMap, championMap];
//   }
//
//   const [items, champions] = await Promise.all([
//     getItemList(version),
//     getChampions(version),
//   ]);
//
//   config.set(`appLang`, appLang);
//   config.set(`itemMap`, items);
//   config.set(`championMap`, champions);
//   config.set(`lolVer`, version);
//
//   return [version, items, champions];
// }

(async () => {
  await app.whenReady();
  Menu.setApplicationMenu(null);
  registerMainListeners();

  mainWindow = await createMainWindow();
  popupWindow = await createPopupWindow();
  await centerWindow({
    window: mainWindow,
    animated: true,
  });

  // const [lolVer, itemMap, championMap] = await prepareData();
  // mainWindow.webContents.send(`lol-data-loaded`, {
  //   lolVer,
  //   itemMap,
  //   championMap,
  // });
})();
