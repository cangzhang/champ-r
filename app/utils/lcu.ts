import { promises as fs, constants as fsConstants } from 'fs';
import * as path from 'path';
import cjk from 'cjk-regex';
import chokidar, { FSWatcher } from 'chokidar';
import WebSocket from 'ws';

import { ILcuAuth } from '@interfaces/commonTypes';
import { appConfig } from './config';
import { LcuMessageType } from '../constants/events';

const cjk_charset = cjk();

export async function ifIsCNServer(dir: string) {
  if (!dir) {
    return false;
  }

  const target = path.join(dir, `TCLS`, `Client.exe`);
  let result = false;
  try {
    await fs.access(dir, fsConstants.F_OK);
    await fs.access(target, fsConstants.F_OK);
    result = true;
  } catch (err) {
    console.info(err);
  }

  appConfig.set(`appendGameToDir`, result);
  const hasCjk = hasCJKChar(dir);
  appConfig.set(`lolDirHasCJKChar`, hasCjk);
  console.log('shouldAppendGameToDir: ', result, `lolDirHasCJKChar: `, hasCjk);
  return result;
}

export const hasCJKChar = (p: string) => {
  return cjk_charset.toRegExp().test(p);
};

export async function parseAuthInfo(p: string): Promise<ILcuAuth> {
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

export enum WatchEvent {
  ADD = `ADD`,
  CHANGE = `CHANGE`,
  UNLINK = `UNLINK`,
  INIT = `INIT`,
}

export class LockfileWatcher {
  private watcher: FSWatcher | null = null;
  private lolDir: string = ``;
  private auth: ILcuAuth | null = null;
  private ws: WebSocket | null = null;

  constructor(dir?: string) {
    const lolDir = dir || appConfig.get(`lolDir`);
    if (lolDir) {
      this.initWatcher(lolDir);
    }
  }

  public async getLcuStatus(dir: string) {
    const isCN = await ifIsCNServer(dir);
    const p = path.join(dir, isCN ? `LeagueClient` : ``, `lockfile`);
    await this.onFileChange(p, WatchEvent.INIT);
  }

  public initWatcher(dir: string) {
    console.log(`init lockfile watcher, dir: ${dir}`);
    this.lolDir = dir;

    this.watcher = chokidar.watch([
      path.join(dir, `LeagueClient`, `lockfile`),
      path.join(dir, `lockfile`),
    ]);

    this.watcher
      .on('add', (path) => this.onFileChange(path, WatchEvent.ADD))
      .on('change', (path) => this.onFileChange(path, WatchEvent.CHANGE))
      .on('unlink', (path) => this.onFileChange(path, WatchEvent.UNLINK));

    this.getLcuStatus(dir);
  }

  private async onFileChange(p: string, action: string) {
    console.log(`[watcher] ${p} ${action}`);

    if (action === WatchEvent.UNLINK) {
      console.info(`[watcher] lcu is inactive`);
      return;
    }

    try {
      const info = await parseAuthInfo(p);
      console.log(info);
    } catch (err) {
      console.error(err.message);
      console.info(`[watcher] get auth failed, either lcu is not or lol dir is incorrect`);
      this.onLcuClose();
    }
  }

  public async changeDir(dir: string) {
    if (this.lolDir === dir) {
      return;
    }

    try {
      await this.watcher?.close();
    } catch (err) {
      console.error(err);
    } finally {
      this.initWatcher(dir);
    }
  }

  public handleLcuMessage(message: string) {
    const [type, ...data] = JSON.parse(message);
    console.log(type, data);
  }

  public onLcuClose() {
    if (!this.ws) {
      return;
    }

    this.ws.terminate();
    console.log(`[watcher] ws closed`);
  }

  public onAuthUpdate(data: ILcuAuth | null) {
    if (!data) {
      return;
    }

    if (data.urlWithAuth === this.auth?.urlWithAuth) {
      return;
    }

    this.auth = data;
    const { port, token } = data;
    const Authorization = Buffer.from(`riot:${token}`).toString('base64');
    const ws = new WebSocket(`wss://127.0.0.1:${port}`, {
      headers: {
        Authorization,
      },
    });
    ws.on(`open`, () => {
      ws.send(JSON.stringify([LcuMessageType.SUBSCRIBE, `OnJsonApiEvent`]));
    });
    ws.on(`message`, this.handleLcuMessage);

    this.ws = ws;
  }
}
