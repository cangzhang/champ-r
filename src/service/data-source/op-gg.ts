import { nanoid as uuid } from 'nanoid';
import _noop from 'lodash/noop';
import axios from 'axios';

import http from 'src/service/http';
import { addFetched, addFetching } from 'src/share/actions';
import { saveToFile } from 'src/share/file';
import Sources from 'src/share/constants/sources';
import SourceProto from './source-proto';
import { IChampionCdnDataItem, IRuneItem, IFileResult, IChampionInfo } from 'src/typings/commonTypes';

const CancelToken = axios.CancelToken;
const CDN_URL = `https://cdn.jsdelivr.net/npm/@champ-r/op.gg`;
const T_NPM_URL = `https://registry.npm.taobao.org/@champ-r/op.gg`;

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

type IFetchResult = {
  status: string;
  reason: IFetchFailedData;
  value: IFetchFailedData;
} | {
  status: string;
  value: IFileResult;
  reason?: IFileResult;
};

export default class OpGG extends SourceProto {
  constructor(public version = ``, public lolDir = ``, public itemMap = {}, public dispatch = _noop) {
    super();
  }

  static getPkgInfo = () => SourceProto.getPkgInfo(T_NPM_URL, CDN_URL);

  public getChampionList = async () => {
    try {
      const version = await SourceProto.getLatestVersionFromCdn(T_NPM_URL);
      const data: { [key: string]: IChampionInfo } = await http.get(`${CDN_URL}@${version}/index.json?${Date.now()}}`, {
        cancelToken: new CancelToken(this.setCancelHook(`fetch-champion-list`)),
      });
      return data;
    } catch (err) {
      console.error(err);
      return Promise.reject({
        stage: Stages.FETCH_CHAMPION_LIST,
      });
    }
  };

  public getChampionDataFromCdn = async (champion: string, $identity: string = ``) => {
    try {
      const version = await SourceProto.getLatestVersionFromCdn(T_NPM_URL);
      const data: IChampionCdnDataItem[] = await http.get(`${CDN_URL}@${version}/${champion}.json?${Date.now()}`, {
        cancelToken: new CancelToken(this.setCancelHook($identity)),
      });
      return data;
    } catch (err) {
      console.error(err);
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
          source: Sources.Opgg,
        }),
      );

      const data = await this.getChampionDataFromCdn(champion);
      const tasks = data.reduce((t, i) => {
        const { position, itemBuilds } = i;
        itemBuilds.forEach((k) => {
          const file = {
            ...k,
            champion,
            position,
            fileName: `[${Sources.Opgg.toUpperCase()}] ${position} - ${champion}`,
          };
          t = t.concat(saveToFile(lolDir, file));
        });

        return t;
      }, [] as Promise<IFileResult>[]);

      const r = await Promise.allSettled(tasks);

      this.dispatch(
        addFetched({
          champion,
          $identity,
          source: Sources.Opgg,
        }),
      );

      return r;
    } catch (err) {
      console.error(err);
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
      console.error(err);
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
              : cur.value as any, // TODO
          ),
        [] as IFetchResult[],
      );

      const [fulfilled, rejected] = this.makeResult(result);
      return {
        fulfilled,
        rejected,
      };
    } catch (err) {
      console.error(err);
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
