import { promises as fs, constants as fsConstants } from 'fs';
import * as path from 'path';
import cjk from 'cjk-regex';
import got, { Got } from 'got';
import { execCmd } from './cmd';

import {
  IChampionSelectActionItem,
  IChampionSelectRespData,
  IChampionSelectTeamItem,
  ILcuAuth,
  IPerkPage,
} from '@interfaces/commonTypes';
import { appConfig } from './config';
import { GamePhase, LcuEvent, LcuMessageType } from '../constants/events';

process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
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

export enum WsWatchEvent {
  Add = `ADD`,
  Change = `CHANGE`,
  Unlink = `UNLINK`,
  Init = `INIT`,
}

interface IBusListener {
  event: LcuEvent;
  fn: Function;
  once: boolean;
}

interface IEventBus {
  emit: (ev: string, data?: any) => void;
  listeners: IBusListener[];
}

const getAuthFromPs = async (): Promise<ILcuAuth | null> => {
  try {
    const stdout = await execCmd(
      `Get-CimInstance Win32_Process -Filter "name = 'LeagueClientUx.exe'" | Select CommandLine | ConvertTo-Json`,
      true,
    );
    const cmdLine = (JSON.parse(stdout) ?? {}).CommandLine ?? ``;
    const port = cmdLine.split('--app-port=')[1]?.split('"')[0] ?? ``;
    const token = cmdLine.split('--remoting-auth-token=')[1]?.split('"')[0] ?? ``;
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

const getAuthFromCmd = async (): Promise<ILcuAuth | null> => {
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

export class LcuWatcher {
  private evBus: IEventBus | null = null;
  private request!: Got;

  private auth: ILcuAuth | null = null;
  private summonerId = 0;
  private lcuURL = ``;
  private getAuthTask: NodeJS.Timeout | null = null;
  private checkLcuStatusTask: NodeJS.Timeout | null = null;
  private watchChampSelectTask: NodeJS.Timeout | null = null;

  constructor() {
    this.initListener();
    this.startAuthTask();
  }

  public startAuthTask = () => {
    clearTimeout(this.getAuthTask!);

    this.getAuthTask = setTimeout(async () => {
      try {
        await this.getAuthFromCmd();
      } catch (e) {
        console.error(`[watcher] [getAuthTask]`, e);
      } finally {
        this.startAuthTask();
      }
    }, 2000);
  };

  public startCheckLcuStatusTask = () => {
    clearInterval(this.checkLcuStatusTask!);

    this.checkLcuStatusTask = setInterval(async () => {
      try {
        await this.getSummonerId();
      } catch (err) {
        console.info(`[watcher] lcu is not active,`, err.message);
        clearInterval(this.checkLcuStatusTask!);
        this.startAuthTask();
      }
    }, 4000);
  };

  public getAuthFromCmd = async () => {
    try {
      const cmdRet = await Promise.all([getAuthFromPs(), getAuthFromCmd()]);
      const { port: appPort, token: remotingAuthToken, urlWithAuth: lcuURL } =
        cmdRet.filter(Boolean)[0] ?? {};

      if (appPort && remotingAuthToken) {
        if (lcuURL !== this.lcuURL) {
          this.lcuURL = lcuURL ?? ``;
          console.info(this.lcuURL);
        }

        clearTimeout(this.getAuthTask!);
        clearInterval(this.checkLcuStatusTask!);

        this.request = got.extend({
          prefixUrl: this.lcuURL,
        });

        this.startCheckLcuStatusTask();
        this.watchChampSelect();
      } else {
        console.warn(`[watcher] fetch lcu status failed`);
        this.hidePopup();
      }
    } catch (err) {
      console.warn(`[watcher] [cmd] lcu is not active`, err.message);
    }
  };

  public watchChampSelect = () => {
    clearInterval(this.watchChampSelectTask!);

    this.watchChampSelectTask = setInterval(async () => {
      try {
        const ret: IChampionSelectRespData = await this.request
          .get(`lol-champ-select/v1/session`)
          .json();
        this.onSelectChampion(ret);
      } catch (_err) {
        clearInterval(this.watchChampSelectTask!);
        this.getAuthFromCmd();
        this.hidePopup();
      }
    }, 2000);
  };

  public getSummonerId = async () => {
    const ret: { summonerId: number } = await this.request
      .get(`lol-chat/v1/me`, {
        timeout: {
          request: 3500,
        },
      })
      .json();

    const summonerId = ret?.summonerId ?? 0;
    if (summonerId !== this.summonerId) {
      console.info(`[watcher] lcu status changed`);
      this.summonerId = summonerId;
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

  public onSelectChampion = (data: IChampionSelectRespData) => {
    // console.log(data);
    const { myTeam = [], actions = [], timer, localPlayerCellId } = data;
    if (timer?.phase === GamePhase.GameStarting || this.summonerId <= 0 || myTeam.length === 0) {
      // match started or ended
      this.hidePopup();
      return;
    }

    let championId;
    championId = this.findChampionIdFromMyTeam(myTeam, localPlayerCellId);
    if (championId === 0) {
      championId = this.findChampionIdFromActions(actions, localPlayerCellId);
    }

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
    if (!this.auth && !this.lcuURL) {
      throw new Error(`[lcu] no auth available`);
    }

    try {
      const list: IPerkPage[] = await this.request.get(`lol-perks/v1/pages`).json();
      const current = list.find((i) => i.current && i.isDeletable);
      if (current?.id) {
        await this.request.delete(`lol-perks/v1/pages/${current.id}`).json();
      }
      await this.request
        .post(`lol-perks/v1/pages`, {
          json: data,
        })
        .json();
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  };
}
