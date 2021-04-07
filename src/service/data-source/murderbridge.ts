import _noop from 'lodash/noop';
import { nanoid as uuid } from 'nanoid';
import axios from 'axios';

import http from 'src/service/http';
import SourceProto, { fetchLatestVersionFromCdn } from 'src/service/data-source/source-proto';
import * as Ddragon from 'src/service/ddragon';
import Sources from 'src/share/constants/sources';
import { saveToFile } from 'src/share/file';
import { addFetched, addFetching } from 'src/share/actions';
import { IChampionCdnDataItem, IFileResult, IRuneItem } from 'src/typings/commonTypes';

const CancelToken = axios.CancelToken;
const CDN_URL = `https://cdn.jsdelivr.net/npm/@champ-r/murderbridge`;
const T_NPM_URL = `https://registry.npm.taobao.org/@champ-r/murderbridge`;

export default class MurderBridge extends SourceProto {
  public version = ``;

  constructor(public lolDir: string, public dispatch = _noop) {
    super();
  }

  static getPkgInfo = () => SourceProto.getPkgInfo(T_NPM_URL, CDN_URL);

  getChampionDataFromCDN = async (champion: string, version: string, $id: string) => {
    try {
      const data: IChampionCdnDataItem[] = await http.get(`${CDN_URL}@${version}/${champion}.json`, {
        cancelToken: new CancelToken(this.setCancelHook($id)),
      });
      return data;
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  };

  genBuildsFromCDN = async (champion: string, version: string, lolDir: string) => {
    try {
      const $identity = uuid();
      this.dispatch(
        addFetching({
          champion,
          $identity,
          source: Sources.MurderBridge,
        }),
      );

      const data = await this.getChampionDataFromCDN(champion, version, $identity);
      const tasks = data.reduce((t, i) => {
        const { position, itemBuilds } = i;
        itemBuilds.forEach((k) => {
          const file = {
            ...k,
            champion,
            position,
            fileName: `[${Sources.MurderBridge.toUpperCase()}] ${champion}`,
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
          source: Sources.MurderBridge,
        }),
      );
      return r;
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  };

  importFromCDN = async () => {
    try {
      const { version, sourceVersion } = await MurderBridge.getPkgInfo();
      const championList = await Ddragon.getChampions(sourceVersion);

      const tasks = Object.values(championList).map((champion) =>
        this.genBuildsFromCDN(champion.id, version, this.lolDir),
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
        [],
      );
      console.info(`[MB]: all done.`);
      return result;
    } catch (err) {
      throw new Error(err);
    }
  };

  getRunesFromCDN = async (champion: string) => {
    try {
      const $id = uuid();
      const pkgVersion = await fetchLatestVersionFromCdn(T_NPM_URL);
      const data = await this.getChampionDataFromCDN(champion, pkgVersion, $id);
      return data.reduce((arr, i) => arr.concat(i.runes), [] as IRuneItem[]);
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  };
}
