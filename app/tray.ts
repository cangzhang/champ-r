import path from 'path';
import { isDev } from './service';
import { app, Menu, nativeImage, Tray } from 'electron';
import { toggleMainWindow } from './listeners';

import BrowserWindow = Electron.BrowserWindow;

interface ITrayOptions {
  minimized?: boolean;
}

export function makeTray({ minimized = false }: ITrayOptions, mainWindow: BrowserWindow) {
  const iconPath = path.join(
    isDev ? `${__dirname}/../` : process.resourcesPath,
    'resources/app-icon.png',
  );
  const icon = nativeImage.createFromPath(iconPath).resize({ width: 24, height: 24 });

  let tray = new Tray(icon);
  // tray.setIgnoreDoubleClickEvents(true)
  tray.setToolTip('ChampR');
  tray.on(`click`, () => {
    toggleMainWindow(mainWindow);
  });
  const contextMenu = Menu.buildFromTemplate([
    {
      label: `Toggle window`,
      click() {
        toggleMainWindow(mainWindow);
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

  if (minimized) {
    tray.displayBalloon({
      icon: iconPath,
      title: `ChampR`,
      content: `ChampR started minimized`,
    });
  }

  return tray
}
