import { nanoid as uuid } from 'nanoid';
import _noop from 'lodash/noop';
import axiosRetry from 'axios-retry';

import http, { CancelToken } from 'src/service/http';
import { addFetched, addFetching } from 'src/share/actions';
import SourceProto from './source-proto';
import {
  IChampionCdnDataItem,
  IRuneItem,
  IFileResult,
  IChampionInfo,
} from '@interfaces/commonTypes';

export const CDN_PREFIX = `https://unpkg.com/@champ-r`;
export const CHINA_CDN_PREFIX = `https://npm.elemecdn.com/@champ-r`;

export const T_NPM_PREFIX = `https://mirrors.cloud.tencent.com/npm/@champ-r`;
export const NPM_MIRROR = `https://mirrors.cloud.tencent.com/npm`;

export const getCDNPrefix = (enableChinaCDN = false) =>
  enableChinaCDN ? CHINA_CDN_PREFIX : CDN_PREFIX;

const Stages = {
  FETCH_CHAMPION_LIST: `FETCH_CHAMPION_LIST`,
  FETCH_CHAMPION_DATA: `FETCH_CHAMPION_DATA`,
  GEN_DATA_FILE: `GEN_DATA_FILE`,
};

axiosRetry(http, {
  retries: 3,
  retryCondition: (err) => {
    console.log(err.response?.status);
    return (err.response?.status ?? 200) >= 400;
  },
  retryDelay: () => 200,
});

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
  public tNpmUrl = ``;
  public version = ``;
  public sourceVersion = ``;
  // public webUrl = ``;

  constructor(public pkgName = ``, public dispatch = _noop) {
    super();
    this.tNpmUrl = `${T_NPM_PREFIX}/${pkgName}/latest`;
  }

  get cdnPrefix() {
    const enable = window.bridge.appConfig.get(`enableChinaCDN`, false);
    const urlPrefix = getCDNPrefix(enable);
    return `${urlPrefix}/${this.pkgName}`;
  }

  get cdnUrl() {
    const enable = window.bridge.appConfig.get(`enableChinaCDN`, false);
    const urlPrefix = getCDNPrefix(enable);
    return `${urlPrefix}/${this.pkgName}/latest`;
  }

  public getPkgInfo = () => SourceProto.getPkgInfo(this.tNpmUrl, this.cdnUrl);

  public getSourceVersion = async () => {
    if (!this.sourceVersion) {
      await this.getLatestPkgVer();
    }

    return this.sourceVersion;
  };

  public getLatestPkgVer = async () => {
    try {
      const data: { version: string; sourceVersion: string } = await http.get(
        `${this.tNpmUrl}?_=${Date.now()}`,
      );
      this.sourceVersion = data.sourceVersion;
      return data.version;
    } catch (err) {
      console.error(err);
      return Promise.resolve(`latest`);
    }
  };

  public getChampionList = async () => {
    try {
      if (!this.version) {
        this.version = await this.getLatestPkgVer();
      }

      const data: { [key: string]: IChampionInfo } = await http.get(
        `${this.cdnPrefix}@${this.version}/index.json`,
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
        this.version = await this.getLatestPkgVer();
      }

      const data: IChampionCdnDataItem[] = await http.get(
        `${this.cdnPrefix}@${this.version}/${champion}.json`,
        {
          cancelToken: new CancelToken(this.setCancelHook($identity)),
        },
      );
      return data;
    } catch (err) {
      const { response } = err;
      if (response.status === 404) {
        return response;
      }

      console.log(err.response.status, err.response.headers);
      throw new Error(err);
    }
  };

  public genItemBuilds = async (champion: string, lolDir: string, sortrank: number) => {
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

      if (!data || data.status >= 400) {
        return Promise.resolve(null);
      }
      const tasks = (data as IChampionCdnDataItem[]).reduce((t, i) => {
        const { position, itemBuilds } = i;
        const pStr = position ? `${position} - ` : ``;
        itemBuilds.forEach((k, idx) => {
          const file = {
            ...k,
            champion,
            position,
            fileName: `[${this.pkgName.toUpperCase()}] ${pStr}${champion}-${idx + 1}`,
          };
          t = t.concat(window.bridge.file.saveToFile(lolDir, file, true, sortrank));
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
      if (!data || data.status >= 400) {
        return Promise.reject(data);
      }

      return (data as IChampionCdnDataItem[]).reduce(
        (arr, i) => arr.concat(i.runes),
        [] as IRuneItem[],
      );
    } catch (err) {
      console.error(err.message, err.stack);
      return Promise.reject(err);
    }
  };

  public importFromCdn = async (lolDir: string, index = 0) => {
    try {
      const championMap = await this.getChampionList();
      const tasks = Object.keys(championMap).map((champion) =>
        this.genItemBuilds(champion, lolDir, index + 1),
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
      const { status, value, reason } = v ?? {};
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
