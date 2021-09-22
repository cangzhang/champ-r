import { promises as fs, constants as fsConstants, watch as fsWatch } from 'fs';
import * as path from 'path';
import fse from 'fs-extra';
import cjk from 'cjk-regex';
import { BrowserWindow } from 'electron';

import appStore from '../src/native/config';

const cjk_charset = cjk();

export async function ifIsCNServer(dir: string) {
  const target = path.join(dir, `TCLS`, `Client.exe`);
  let result = false;
  try {
    await fs.access(dir, fsConstants.F_OK);
    await fs.access(target, fsConstants.F_OK);
    result = true;
  } catch (err) {
    console.info(err);
  }

  appStore.set(`appendGameToDir`, result);
  const hasCjk = hasCJKChar(dir);
  appStore.set(`lolDirHasCJKChar`, hasCjk);
  console.log('shouldAppendGameToDir: ', result, `lolDirHasCJKChar: `, hasCjk);
  return result;
}

export const hasCJKChar = (p: string) => {
  return cjk_charset.toRegExp().test(p);
};

let checkTask: NodeJS.Timeout;

export async function watchLockFile(wins: (BrowserWindow | null)[]) {
  const dir = appStore.get(`lolDir`);
  try {
    if (!dir) {
      throw new Error(`please select lol dir first.`);
    }

    const appendGameToDir = await ifIsCNServer(dir);
    const lockFilePath = path.join(dir, appendGameToDir ? `LeagueClient` : ``, `lockfile`);
    const exists = await fse.pathExists(lockFilePath);
    if (!exists) {
      throw new Error(`${lockFilePath} not exists, lcu is inactive.`);
    }

    clearInterval(checkTask);
    const auth = await getAuthConfig(lockFilePath);
    wins.forEach((w) => {
      console.log(`send data to web contents...`);
      w?.webContents.send(`got-auth`, auth);
    });

    fsWatch(lockFilePath, async (_, newName) => {
      try {
        const auth = await getAuthConfig(newName);

        wins.forEach((w) => {
          console.log(`send data to web contents...`);
          w?.webContents.send(`got-auth`, auth);
        });
      } catch (err) {
        throw err;
      }
    });
  } catch (err) {
    console.info(err.message);
    clearInterval(checkTask);
    checkTask = setInterval(() => {
      watchLockFile(wins);
    }, 1000);
  }
}

export async function getAuthConfig(p: string) {
  try {
    const lockfile = await fs.readFile(p, `utf8`);
    const port = lockfile.split(`:`)[2];
    const token = lockfile.split(`:`)[3];
    const url = `://riot:${token}@127.0.0.1:${port}`;
    const urlWithAuth = `https${url}`;

    return {
      port,
      token,
      urlWithAuth,
    };
  } catch (err) {
    return Promise.reject(err);
  }
}
