import { nanoid as uuid } from 'nanoid';
import _noop from 'lodash/noop';

import http, { CancelToken } from 'src/service/http';
import { addFetched, addFetching } from 'src/share/actions';
import SourceProto from './source-proto';
import {
  IChampionCdnDataItem,
  IRuneItem,
  IFileResult,
  IChampionInfo,
} from '@interfaces/commonTypes';

export const CDN_PREFIX = `https://cdn.jsdelivr.net/npm/@champ-r`;
export const T_NPM_PREFIX = `https://registry.npmmirror.com/@champ-r`;
// export const NPM_MIRROR = `https://registry.npm.taobao.org`
export const NPM_MIRROR = `https://registry.npmmirror.com`;

const Stages = {
  FETCH_CHAMPION_LIST: `FETCH_CHAMPION_LIST`,
  FETCH_CHAMPION_DATA: `FETCH_CHAMPION_DATA`,
  GEN_DATA_FILE: `GEN_DATA_FILE`,
};

interface IFetchFailedData {
  champion: string;
  stage: string;
  position?: string;
}

type IFetchResult =
  | {
      status: string;
      reason: IFetchFailedData;
      value: IFetchFailedData;
    }
  | {
      status: string;
      value: IFileResult;
      reason?: IFileResult;
    };

export default class CdnService extends SourceProto {
  public cdnUrl = ``;
  public tNpmUrl = ``;
  public version = ``;

  constructor(public pkgName = ``, public dispatch = _noop) {
    super();
    this.cdnUrl = `${CDN_PREFIX}/${pkgName}`;
    this.tNpmUrl = `${T_NPM_PREFIX}/${pkgName}`;
  }

  public getPkgInfo = () => SourceProto.getPkgInfo(this.tNpmUrl, this.cdnUrl);

  public getPkgInfoFromJsdelivr = async () => {
    try {
      const info: any = await http.get(`${this.cdnUrl}@latest/package.json`);
      return info.sourceVersion;
    } catch (err) {
      console.error(err);
      return Promise.resolve(`latest`);
    }
  };

  public getLatestPkgVerFromJsdelivr = async () => {
    try {
      const info: any = await http.get(`${this.cdnUrl}@latest/package.json`);
      this.version = info.version;
      return info.version;
    } catch (err) {
      console.error(err);
      return Promise.resolve(`latest`);
    }
  };

  public getChampionList = async () => {
    try {
      if (!this.version) {
        this.version = await this.getLatestPkgVerFromJsdelivr();
      }

      const data: { [key: string]: IChampionInfo } = await http.get(
        `${this.cdnUrl}@${this.version}/index.json`,
        {
          cancelToken: new CancelToken(this.setCancelHook(`fetch-champion-list`)),
        },
      );
      return data;
    } catch (err) {
      console.error(err.message, err.stack);
      return Promise.reject({
        stage: Stages.FETCH_CHAMPION_LIST,
      });
    }
  };

  public getChampionDataFromCdn = async (champion: string, $identity: string = ``) => {
    try {
      if (!this.version) {
        this.version = await this.getLatestPkgVerFromJsdelivr();
      }

      const data: IChampionCdnDataItem[] = await http.get(
        `${this.cdnUrl}@${this.version}/${champion}.json`,
        {
          cancelToken: new CancelToken(this.setCancelHook($identity)),
        },
      );
      return data;
    } catch (err) {
      console.error(err.stack);
      throw new Error(err);
    }
  };

  public genItemBuilds = async (champion: string, lolDir: string) => {
    try {
      const $identity = uuid();
      this.dispatch(
        addFetching({
          champion,
          $identity,
          source: this.pkgName,
        }),
      );

      const data = await this.getChampionDataFromCdn(champion);
      const tasks = data.reduce((t, i) => {
        const { position, itemBuilds } = i;
        const pStr = position ? `${position} - ` : ``;
        itemBuilds.forEach((k, idx) => {
          const file = {
            ...k,
            champion,
            position,
            fileName: `[${this.pkgName.toUpperCase()}] ${pStr}${champion}-${idx + 1}`,
          };
          t = t.concat(window.bridge.file.saveToFile(lolDir, file));
        });

        return t;
      }, [] as Promise<IFileResult | Error>[]);

      const r = await Promise.allSettled(tasks);

      this.dispatch(
        addFetched({
          champion,
          $identity,
          source: this.pkgName,
        }),
      );

      return r;
    } catch (err) {
      console.error(err.message, err.stack);
      return Promise.reject({
        champion: champion,
        stage: Stages.GEN_DATA_FILE,
      });
    }
  };

  public getRunesFromCDN = async (alias: string) => {
    try {
      const $id = uuid();
      const data = await this.getChampionDataFromCdn(alias, $id);
      return data.reduce((arr, i) => arr.concat(i.runes), [] as IRuneItem[]);
    } catch (err) {
      console.error(err.message, err.stack);
      return Promise.reject(err);
    }
  };

  public importFromCdn = async (lolDir: string) => {
    try {
      const championMap = await this.getChampionList();
      const tasks = Object.keys(championMap).map((champion) =>
        this.genItemBuilds(champion, lolDir),
      );
      const r = await Promise.allSettled(tasks);
      const result = r.reduce(
        (arr, cur) =>
          arr.concat(
            cur.status === `rejected`
              ? {
                  status: `rejected`,
                  value: cur.reason,
                  reason: cur.reason,
                }
              : (cur.value as any), // TODO
          ),
        [] as IFetchResult[],
      );

      const [fulfilled, rejected] = this.makeResult(result);
      return {
        fulfilled,
        rejected,
      };
    } catch (err) {
      console.error(err.message, err.stack);
      throw new Error(err);
    }
  };

  public makeResult = (result: IFetchResult[]) => {
    const fulfilled = [];
    const rejected = [];
    for (const v of result) {
      const { status, value, reason } = v;
      switch (status) {
        case 'fulfilled':
          fulfilled.push([value.champion, value.position]);
          break;
        case 'rejected':
          rejected.push([reason!.champion, reason!.position]);
          break;
        default:
          break;
      }
    }

    return [fulfilled, rejected];
  };
}
