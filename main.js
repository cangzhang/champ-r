
const path = require('path');

const { app, BrowserWindow, Menu } = require('electron');
/// const { autoUpdater } = require('electron-updater');
const { is, disableZoom, centerWindow } = require('electron-util');
const contextMenu = require('electron-context-menu');

const unhandled = require('electron-unhandled');
const debug = require('electron-debug');
const isDev = require('electron-is-dev');

unhandled();
debug();
contextMenu();

// Note: Must match `build.appId` in package.json
app.setAppUserModelId('com.al.champ-r');

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

const createMainWindow = async () => {
  const win = new BrowserWindow({
    title: app.name,
    show: false,
    frame: false,
    height: 800,
    width: is.development ? 1300 : 500,
    webPreferences: {
      nodeIntegration: true,
      webSecurity: false,
    },
  });

  win.on('ready-to-show', () => {
    win.show();
  });

  win.on('closed', () => {
    // Dereference the window
    // For multiple windows store them in an array
    mainWindow = undefined;
  });

  await win.loadURL(
    isDev ?
      'http://127.0.0.1:3000' :
      `file://${path.join(__dirname, 'build/index.html')}`,
  );

  return win;
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

(async () => {
  await app.whenReady();
  Menu.setApplicationMenu(null);
  mainWindow = await createMainWindow();

  await disableZoom(mainWindow);
  await centerWindow({
    window: mainWindow,
    animated: true,
  });
})();
