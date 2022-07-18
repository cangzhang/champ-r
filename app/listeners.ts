import got from 'got';
import fse from 'fs-extra';
import tar from 'tar';
import { nanoid } from 'nanoid';
import { app, dialog, ipcMain, screen } from 'electron';

import { IPopupEventData, IRuneItem } from '@interfaces/commonTypes';
import { appConfig } from './utils/config';
import { ifIsCNServer, LcuWatcher } from './utils/lcu';
import { bufferToStream, getAllFileContent, removeFolderContent, saveToFile, updateDirStats } from './utils/file';
import { isDev, sleep } from './utils';
import { onShowPopup } from './main';

import BrowserWindow = Electron.BrowserWindow;

export function toggleMainWindow(mainWindow: BrowserWindow | null) {
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

export function registerMainListeners(mainWindow: BrowserWindow, popupWindow: BrowserWindow, lcuWatcher: LcuWatcher) {
  function updateStatusForMainWindowWebView(data: any) {
    mainWindow?.webContents.send(`apply_builds_process`, {
      data,
      id: nanoid(),
    });
  }

  ipcMain.on(`toggle-main-window`, () => {
    toggleMainWindow(mainWindow);
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

    appConfig.set(`popup.alwaysOnTop`, next);
  });

  ipcMain.on(`popup:reset-position`, () => {
    const [mx, my] = mainWindow!.getPosition();
    const { bounds } = screen.getDisplayNearestPoint({ x: mx, y: my });
    const [x, y] = [bounds.width / 2, bounds.height / 2];

    appConfig.set(`popup.alwaysOnTop`, true);
    appConfig.set(`popup.x`, x);
    appConfig.set(`popup.y`, y);

    if (!popupWindow) {
      return;
    }

    popupWindow.setAlwaysOnTop(true);
    popupWindow.setPosition(x, y);
  });

  ipcMain.on(`updateLolDir`, async (_ev, { lolDir }) => {
    console.info(`lolDir is ${lolDir}`);
    appConfig.set(`lolDir`, lolDir);
    if (!lolDir) {
      return;
    }
  });

  ipcMain.on(`request-for-auth-config`, () => {
    const lolDir = appConfig.get(`lolDir`);
    ifIsCNServer(lolDir);
  });

  ipcMain.on(`openSelectFolderDialog`, async (_, { jobId }: any) => {
    try {
      const data = await dialog.showOpenDialog({ properties: ['openDirectory'] });
      mainWindow?.webContents.send(`openSelectFolderDialog:done:${jobId}`, {
        ...data,
        jobId,
      });
    } catch (e) {
      mainWindow?.webContents.send(`openSelectFolderDialog:reject:${jobId}`, e);
    }
  });

  ipcMain.on(`quit-app`, () => {
    app.quit();
  });

  ipcMain.on(`applyRunePage`, async (_ev, data: IRuneItem & { jobId: string }) => {
    try {
      await lcuWatcher?.applyRunePage(data);
      popupWindow!.webContents.send(`applyRunePage:done:${data.jobId}`);
    } catch (err) {
      console.error(`[main] apply perk failed: `, err.message);
    } finally {
      if (isDev) {
        popupWindow!.webContents.send(`applyRunePage:done:${data.jobId}`);
      }
    }
  });

  ipcMain.on(`showPopup`, (_ev, data: IPopupEventData) => {
    onShowPopup(data);
  });

  ipcMain.on(`hidePopup`, () => {
    popupWindow?.hide();
  });

  ipcMain.on(`PrepareSourceData`, async (_ev, source) => {
    let url = `https://registry.npmmirror.com/@champ-r/${source}/latest`;
    let cwd = `.npm/${source}/`;
    let lolDir = appConfig.get(`lolDir`);

    try {
      let { dist: { tarball } } = await got(url, {
        responseType: `json`,
      }).json();
      updateStatusForMainWindowWebView({
        source,
        msg: `Fetched metadata for ${source}`,
      });
      console.log(`[npm] downloading tarball for ${source}`);
      updateStatusForMainWindowWebView({
        source,
        msg: `Downloading tarball for ${source}`,
      });
      let { body } = await got(tarball, {
        responseType: 'buffer',
      });
      console.log(`[npm] tarball downloaded, ${source}`);
      updateStatusForMainWindowWebView({
        source,
        msg: `Downloaded tarball for ${source}`,
      });
      let s = bufferToStream(body);
      await fse.ensureDir(cwd);
      console.log(`[npm] extracting to ${cwd}`);
      s.pipe(
        tar.x({
          strip: 1,
          cwd,
        }),
      );
      console.log(`[npm] extracted to ${cwd}`);
      updateStatusForMainWindowWebView({
        source,
        msg: `Extracted data for ${source}`,
      });
      await sleep(3000);
      await updateDirStats(cwd);
      let files = await getAllFileContent(cwd);
      let tasks: any[] = [];
      files.forEach(arr => {
        arr.forEach(i => {
          const { position, itemBuilds } = i;
          const pStr = position ? `${position} - ` : ``;
          itemBuilds.forEach((k, idx) => {
            let champion = i.alias;
            const file = {
              ...k,
              champion,
              position,
              fileName: `[${source.toUpperCase()}] ${pStr}${champion}-${idx + 1}`,
            };
            let task = saveToFile(lolDir, file, true, 0)
              .then((result) => {
                if (result instanceof Error) {
                  console.error(`failed: `, champion, position);
                  return;
                }

                console.log(`Done: `, champion, position, source);
                updateStatusForMainWindowWebView({
                  source,
                  champion,
                  position,
                  msg: `[${source}] Applied builds for ${position ? champion + `@` + position : champion}`,
                });
              });
            tasks.push(task);
          });
        });
      });
      await Promise.all(tasks);
      updateStatusForMainWindowWebView({
        source,
        finished: true,
        msg: `[${source}] Finished.`,
      });
    } catch (e) {
      console.error(source, e);
      updateStatusForMainWindowWebView({
        source,
        error: true,
        e,
        msg: `[${source}] Something went wrong`,
      });
    }
  });

  ipcMain.on(`EmptyBuildsFolder`, async (_ev, { jobId }) => {
    let lolDir = appConfig.get(`lolDir`);
    await Promise.all([
      removeFolderContent(`${lolDir}/Game/Config/Champions`),
      removeFolderContent(`${lolDir}/Config/Champions`),
    ]);
    mainWindow?.webContents.send(`EmptyBuildsFolder:done:${jobId}`);
  });
}
