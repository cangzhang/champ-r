import { promises as fs, constants as fsConstants } from 'fs';
import * as path from 'path';
import cjk from 'cjk-regex';
import chokidar, { FSWatcher } from 'chokidar';
import WebSocket from 'ws';
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

export class LcuWatcher {
  private watcher: FSWatcher | null = null;
  private lolDir: string = ``;
  private auth: ILcuAuth | null = null;
  private ws: WebSocket | null = null;
  private connectTask: NodeJS.Timeout | null = null;
  private evBus: IEventBus | null = null;
  private request!: Got;
  private summonerId = 0;

  private checkTask: NodeJS.Timeout | null = null;
  private lcuURL = ``;

  constructor() {
    // const lolDir = dir || appConfig.get(`lolDir`);
    // if (lolDir) {
    //   this.initWatcher(lolDir);
    // }
    //

    this.initListener();
    this.startCheckAuthTask();
  }

  public getLcuStatus = async (dir: string) => {
    const isCN = await ifIsCNServer(dir);
    const p = path.join(dir, isCN ? `LeagueClient` : ``, `lockfile`);
    await this.onFileChange(p, WsWatchEvent.Init);
  };

  public initWatcher = (dir: string) => {
    console.log(`init lockfile watcher, dir: ${dir}`);
    this.lolDir = dir;

    this.watcher = chokidar.watch([
      path.join(dir, `LeagueClient`, `lockfile`),
      path.join(dir, `lockfile`),
    ]);

    this.watcher
      .on('add', (path) => this.onFileChange(path, WsWatchEvent.Add))
      .on('change', (path) => this.onFileChange(path, WsWatchEvent.Change))
      .on('unlink', (path) => this.onFileChange(path, WsWatchEvent.Unlink));

    this.getLcuStatus(dir);
  };

  public startCheckAuthTask = () => {
    this.checkTask = setInterval(() => {
      this.checkAuthFromCmd();
    }, 2000);
  };

  public checkAuthFromCmd = async () => {
    try {
      const stdout = await execCmd(`wmic PROCESS WHERE name='LeagueClientUx.exe' GET commandline`);
      const appPort = stdout.split('--app-port=')[1]?.split('"')[0] ?? ``;
      const remotingAuthToken = stdout.split('--remoting-auth-token=')[1]?.split('"')[0] ?? ``;
      let lcuURL = `https://riot:${remotingAuthToken}@127.0.0.1:${appPort}`;

      if (appPort && remotingAuthToken) {
        if (lcuURL !== this.lcuURL) {
          this.lcuURL = lcuURL;
          console.info(this.lcuURL);
        }
        clearInterval(this.checkTask!);
        this.request = got.extend({
          prefixUrl: this.lcuURL,
        });

        this.fetchSummonerId().finally(() => {
          this.watchChampSelect();
        });
      } else {
        console.warn(`[watcher] fetch lcu status failed`);
        this.hidePopup();
      }
    } catch (e) {}
  };

  public watchChampSelect = () => {
    let fetchChampionSelectTask = setInterval(async () => {
      try {
        const ret: IChampionSelectRespData = await this.request
          .get(`lol-champ-select/v1/session`)
          .json();
        this.onSelectChampion(ret);
      } catch (_err) {
        clearInterval(fetchChampionSelectTask);
        this.checkAuthFromCmd();
        this.hidePopup();
      }
    }, 2000);
  };

  public fetchSummonerId = async () => {
    try {
      const ret: { summonerId: number } = await this.request.get(`lol-chat/v1/me`).json();
      this.summonerId = ret?.summonerId ?? 0;
    } catch (err) {
      console.error(`[watcher]:`, err);
    }
  };

  private onFileChange = async (p: string, action: string) => {
    // console.log(`[watcher] ${p} ${action}`);
    if (action === WsWatchEvent.Unlink) {
      console.info(`[watcher] lcu is inactive`);
      this.hidePopup();
      return;
    }

    try {
      const info = await parseAuthInfo(p);
      console.log(`[watcher] got auth`);
      await this.onAuthUpdate(info);
    } catch (err) {
      console.error(err.message);
      console.info(`[watcher] get auth failed, either lcu is inactive or lol dir is incorrect`);
      this.onLcuClose();
    }
  };

  public changeDir = async (dir: string) => {
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

  public handleLcuMessage = (buffer: Buffer) => {
    try {
      const msg = JSON.parse(JSON.stringify(buffer.toString()));
      const [_evType, _evName, resp] = JSON.parse(msg);
      if (!resp) {
        return;
      }

      switch (resp.uri) {
        case `/lol-champ-select/v1/session`: {
          this.onSelectChampion(resp.data ?? {});
          return;
        }
        case `/lol-chat/v1/me`: {
          this.summonerId = resp?.data?.summonerId ?? 0;
          return;
        }
        default:
          return;
      }
    } catch (err) {
      console.info(`[watcher] handle lcu message improperly: `, err.message);
    }
  };

  public onLcuClose = () => {
    if (!this.ws) {
      return;
    }

    this.ws.terminate();
    console.log(`[watcher] ws closed`);
  };

  public createWsConnection = async (auth: ILcuAuth) => {
    return new Promise((resolve, reject) => {
      if (this.connectTask) {
        clearTimeout(this.connectTask);
      }

      const ws = new WebSocket(`wss://riot:${auth.token}@127.0.0.1:${auth.port}`, {
        protocol: `wamp`,
      });

      ws.on(`open`, () => {
        ws.send(JSON.stringify([LcuMessageType.SUBSCRIBE, `OnJsonApiEvent`]));
        resolve(ws);
      });

      ws.on(`message`, this.handleLcuMessage);

      ws.on(`error`, (err) => {
        console.error(err.message);
        this.ws = null;

        if (err.message.includes(`connect ECONNREFUSED`)) {
          console.info(`[watcher] lcu ws server is not ready, retry in 3s`);
          this.hidePopup();
          this.connectTask = setTimeout(() => {
            this.createWsConnection(auth);
          }, 3 * 1000);
        } else {
          reject(err);
        }
      });

      this.ws = ws;
    });
  };

  public onAuthUpdate = async (data: ILcuAuth | null) => {
    if (!data) {
      return;
    }

    if (data.urlWithAuth === this.auth?.urlWithAuth) {
      return;
    }

    this.auth = data;
    this.request = got.extend({
      resolveBodyOnly: true,
      prefixUrl: data.urlWithAuth,
    });
    await this.createWsConnection(data);
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
