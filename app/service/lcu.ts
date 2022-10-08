import os from 'os';
import { promises as fs, constants as fsConstants } from 'fs';
import * as path from 'path';
import https from 'https';

import cjk from 'cjk-regex';
import axios, { AxiosInstance } from 'axios';
import { execCmd } from './cmd';

import {
  IChampionSelectActionItem,
  IChampionSelectRespData,
  IChampionSelectTeamItem,
  ILcuAuth,
  IPerkPage,
} from '@interfaces/commonTypes';
import { appConfig } from './config';
import { GamePhase, LcuEvent } from '../constants/events';
import { nanoid } from 'nanoid';

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
  } catch (_err) {
    console.info(`[lcu] maybe it's cn version`);
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

interface IBusListener {
  event: LcuEvent;
  fn: Function;
  once: boolean;
}

export interface IEventBus {
  emit: (ev: string, data?: any) => void;
  listeners: IBusListener[];
}

const makeCmdOutFilePath = () => path.join(os.tmpdir(), `ChampR_${nanoid()}.tmp`);

let cmdOutFile = makeCmdOutFilePath();
const prepareCmdOutFile = async () => {
  try {
    await fs.access(cmdOutFile, fsConstants.R_OK | fsConstants.W_OK);
    await fs.stat(cmdOutFile);
  } catch (e) {
    cmdOutFile = makeCmdOutFilePath();
    await fs.writeFile(cmdOutFile, ``);
  }
};

export const getAuthFromPs = async (): Promise<ILcuAuth | null> => {
  try {
    await prepareCmdOutFile();
    let stdout = await execCmd(
      `Get-CimInstance Win32_Process -Filter "name = 'LeagueClientUx.exe'"| Select-Object -ExpandProperty CommandLine`,
      true,
    );
    if (!stdout.trim().length) {
      return null;
    }

    const port = stdout.split('--app-port=')[1]?.split('"')[0] ?? ``;
    const token = stdout.split('--remoting-auth-token=')[1]?.split('"')[0] ?? ``;
    const urlWithAuth = `https://riot:${token}@127.0.0.1:${port}`;

    return {
      port,
      token,
      urlWithAuth,
    };
  } catch (err) {
    console.error(`[ps] `, err);
    return null;
  }
};

export const getAuthFromCmd = async (): Promise<ILcuAuth | null> => {
  try {
    const cmdLine = await execCmd(
      `wmic PROCESS WHERE name='LeagueClientUx.exe' GET commandline`,
      false,
    );
    const port = cmdLine.split('--app-port=')[1]?.split('"')[0] ?? ``;
    const token = cmdLine.split('--remoting-auth-token=')[1]?.split('"')[0] ?? ``;
    const urlWithAuth = `https://riot:${token}@127.0.0.1:${port}`;

    return {
      port,
      token,
      urlWithAuth,
    };
  } catch (err) {
    console.error(`[cmd] `, err);
    return null;
  }
};

let httpsAgent = new https.Agent({
  keepAlive: true,
});

export class LcuWatcher {
  public evBus: IEventBus | null = null;
  private request!: AxiosInstance;

  private auth: ILcuAuth | null = null;
  private summonerId = 0;
  private lcuURL = ``;
  public wsURL = ``;
  private checkLcuStatusTask: NodeJS.Timeout | null = null;
  private watchChampSelectTask: NodeJS.Timeout | null = null;
  private withPwsh = false;

  constructor(withPwsh: boolean) {
    this.withPwsh = withPwsh;

    this.initListener();
    if (os.platform() === `win32`) {
      this.startCheckLcuStatusTask();
      // this.watchChampSelect();
    } else {
      console.log(`[ChampR] not running on MS Windows, skipped running cmd.`);
    }
  }

  public startCheckLcuStatusTask = () => {
    this.getAuth();
    this.checkLcuStatusTask = setInterval(async () => {
      this.getAuth();
    }, 6000);
  };

  public getAuth = async () => {
    try {
      const cmdRet = this.withPwsh ? await getAuthFromPs() : await getAuthFromCmd();
      const { port: appPort, token: remotingAuthToken, urlWithAuth: lcuURL } = cmdRet ?? {};

      if (appPort && remotingAuthToken) {
        if (lcuURL !== this.lcuURL) {
          this.lcuURL = lcuURL ?? ``;
          console.info(this.lcuURL);
          this.wsURL = `riot:${remotingAuthToken}@127.0.0.1:${appPort}`;
          this.evBus?.emit(LcuEvent.OnAuthUpdate, this.wsURL);
        }

        this.request = axios.create({
          baseURL: this.lcuURL,
          timeout: 3000,
          httpsAgent,
          headers: {
            'Connection': `keep-alive`,
          },
        });

        return true;
      }

      throw new Error(`[watcher] empty output from ps`);
    } catch (err) {
      this.lcuURL = ``;
      console.info(`[watcher] maybe lcu is not running`, err.message);
      return Promise.resolve(false);
    }
  };

  public watchChampSelect = () => {
    clearInterval(this.watchChampSelectTask!);

    this.watchChampSelectTask = setInterval(async () => {
      try {
        // await this.getSummonerId();
        const ret: IChampionSelectRespData = await this.request.get(`${this.lcuURL}/lol-champ-select/v1/session`).then(r => r.data);
        console.log(ret);
        this.onSelectChampion(ret);
      } catch (err) {
        console.error(err);
      }
    }, 2000);
  };

  public getSummonerId = async () => {
    try {
      const ret: { summonerId: number } = await this.request
        .get(`lol-chat/v1/me`);

      const summonerId = ret?.summonerId ?? 0;
      if (summonerId !== this.summonerId) {
        console.info(`[watcher] lcu status changed`);
        this.summonerId = summonerId;
      }
      return true;
    } catch (err) {
      // console.log(err);
      return Promise.resolve(false);
    }
  };

  public findChampionIdFromMyTeam = (myTeam: IChampionSelectTeamItem[] = [], cellId: number) => {
    const me = myTeam.find((i) => i.cellId === cellId);
    return me?.championId ?? 0;
  };

  public findChampionIdFromActions = (actions: IChampionSelectActionItem[][], cellId: number) => {
    let championId = 0;
    for (const row of actions) {
      for (const i of row) {
        if (i.actorCellId === cellId && i.type !== `ban`) {
          championId = i.championId;
          break;
        }
      }
    }

    return championId;
  };

  public getChampionIdFromLcuData = (data: IChampionSelectRespData) => {
    const { myTeam = [], actions = [], localPlayerCellId } = data;
    let championId: number;
    championId = this.findChampionIdFromMyTeam(myTeam, localPlayerCellId);
    if (championId === 0) {
      championId = this.findChampionIdFromActions(actions, localPlayerCellId);
    }

    return championId;
  };

  public onSelectChampion = (data: IChampionSelectRespData) => {
    // console.log(data);
    const { myTeam = [], timer } = data;
    if (timer?.phase === GamePhase.GameStarting || this.summonerId <= 0 || myTeam.length === 0) {
      // match started or ended
      // this.hidePopup();
      return;
    }

    const championId = this.getChampionIdFromLcuData(data);
    if (championId > 0) {
      console.info(`[watcher] picked champion ${championId}`);
      this.evBus!.emit(LcuEvent.SelectedChampion, {
        championId: championId,
      });
    }
  };

  public hidePopup = () => {
    this.evBus!.emit(LcuEvent.MatchedStartedOrTerminated);
  };

  public initListener = () => {
    this.evBus = {
      listeners: [],
      emit: () => null,
    };
    this.evBus!.emit = (ev: string, data?: any) => {
      const listeners = this.evBus!.listeners.filter((i) => i.event === ev);
      listeners.forEach((i) => {
        i.fn(data);

        if (i.once) {
          this.removeListener(ev, i.fn);
        }
      });
    };
  };

  public addListener = (event: LcuEvent, fn: Function, once: boolean = false) => {
    this.evBus!.listeners = (this.evBus!.listeners ?? []).concat({
      event,
      fn,
      once,
    });
  };

  public removeListener = (ev: string, fn: Function) => {
    this.evBus!.listeners = (this.evBus!.listeners ?? []).filter(
      (i) => i.event === ev && i.fn === fn,
    );
  };

  public applyRunePage = async (data: any) => {
    try {
      const list: IPerkPage[] = await this.request.get(`lol-perks/v1/pages`).then(r => r.data);
      const current = list.find((i) => i.current && i.isDeletable);
      if (current?.id) {
        await this.request.delete(`lol-perks/v1/pages/${current.id}`);
      }
      await this.request
        .post(`lol-perks/v1/pages`, data);
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  };
}
