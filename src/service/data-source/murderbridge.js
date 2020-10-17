import _noop from 'lodash/noop';
import { nanoid as uuid } from 'nanoid';
import { CancelToken } from 'axios';

import http from 'src/service/http';
import SourceProto from 'src/service/data-source/source-proto';
import * as Ddragon from 'src/service/ddragon';
import Sources from 'src/share/constants/sources';
import { saveToFile } from 'src/share/file';
import { addFetched, addFetching } from 'src/share/actions';

const CDN_URL = `https://cdn.jsdelivr.net/npm/@champ-r/murderbridge`;
const T_NPM_URL = `https://registry.npm.taobao.org/@champ-r/murderbridge`;

export default class MurderBridge extends SourceProto {
  constructor(lolDir, itemMap, dispatch = _noop) {
    super();
    this.lolDir = lolDir;
    this.itemMap = itemMap;
    this.dispatch = dispatch;
    this.version = null;
  }

  static getPkgInfo = () => SourceProto.getPkgInfo(T_NPM_URL, CDN_URL);

  getChampionDataFromCDN = async (champion, version, $id) => {
    try {
      const data = await http.get(`${CDN_URL}@${version}/${champion}.json`, {
        cancelToken: new CancelToken(this.setCancelHook($id)),
      });
      return data;
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  };

  genBuildsFromCDN = async (champion, version, lolDir) => {
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
      }, []);

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
              : cur.value,
          ),
        [],
      );
      console.info(`[MB]: all done.`);
      return result;
    } catch (err) {
      throw new Error(err);
    }
  };

  getRunesFromCDN = async (champion) => {
    try {
      const $id = uuid();
      const pkgVersion = await SourceProto.getLatestVersionFromCdn(T_NPM_URL);
      const data = await this.getChampionDataFromCDN(champion, pkgVersion, $id);
      return data.reduce((arr, i) => arr.concat(i.runes), []);
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  };
}
