import _noop from 'lodash/noop';
import { nanoid as uuid } from 'nanoid';
import { CancelToken } from 'axios';

import http from 'src/service/http';
import SourceProto from 'src/service/data-source/source-proto';
import * as Ddragon from 'src/service/ddragon';
import Sources from 'src/share/constants/sources';
import { saveToFile } from 'src/share/file';
import { addFetched, addFetching, fetchSourceDone } from 'src/share/actions';

import {
  generalSettings,
  generateOptimalPerks,
  isBoot,
  runeLookUpGenerator,
  scoreGenerator,
} from './utils';

const ApiPrefix = `https://d23wati96d2ixg.cloudfront.net`;

const sortByScore = (a, b) =>
  scoreGenerator(b[1].winRate, b[1].frequency, 2.5, generalSettings) -
  scoreGenerator(a[1].winRate, a[1].frequency, 2.5, generalSettings);

const getItems = (items, limit = 3) => {
  const sorted = Object.entries(items).sort((a, b) => sortByScore(a, b));
  const itemSet = sorted
    .slice(0, limit)
    .map((i) => [].concat(JSON.parse(i[0])))
    .reduce((ids, cur) => {
      cur.forEach((i) => {
        const [target] = [].concat(i);
        ids.add(target);
      });
      return ids;
    }, new Set());
  const result = Array.from(itemSet).map((i) => ({
    id: i,
    count: 1,
  }));

  return result;
};

export default class MurderBridge extends SourceProto {
  constructor(lolDir, itemMap, dispatch = _noop) {
    super();
    this.lolDir = lolDir;
    this.itemMap = itemMap;
    this.dispatch = dispatch;
    this.version = null;
  }

  static getLolVersion = async () => {
    try {
      const { upToDateVersion } = await http.get(`${ApiPrefix}/save/general.json`);
      // this.version = upToDateVersion;
      return upToDateVersion;
    } catch (err) {
      throw new Error(err);
    }
  };

  getRunesReforged = async (version) => {
    try {
      const data = await Ddragon.getRunesReforged(version);
      return data;
    } catch (err) {
      throw new Error(err);
    }
  };

  getChampionPerks = async (champion) => {
    try {
      const version = await MurderBridge.getLolVersion();
      this.version = version;
      const [{ runes }, reforgedRunes] = await Promise.all([
        this.getChampData(champion, version),
        this.getRunesReforged(version),
      ]);
      const runesLookUp = runeLookUpGenerator(reforgedRunes);
      const perks = generateOptimalPerks(null, null, runes, runesLookUp);
      return perks.map((i) => ({
        ...i,
        alias: champion,
        name: `${[Sources.MurderBridge]} ${champion}`,
      }));
    } catch (err) {
      throw new Error(err);
    }
  };

  makeItemBuilds = ({ starting, build }, { id: alias, key }) => {
    const startItems = getItems(starting, 3);
    const startBlocks = {
      type: `Starters`,
      showIfSummonerSpell: '',
      hideIfSummonerSpell: '',
      items: startItems,
    };

    const buildItems = getItems(build, 13);
    const itemsWithoutBoots = buildItems.filter((i) => !isBoot(i.id, this.itemMap));
    const boots = buildItems.filter((i) => isBoot(i.id, this.itemMap));

    const bootBlocks = boots.length > 0 && {
      type: `Boots`,
      showIfSummonerSpell: '',
      hideIfSummonerSpell: '',
      items: boots,
    };
    const buildBlocks = {
      type: `Core Items`,
      showIfSummonerSpell: '',
      hideIfSummonerSpell: '',
      items: itemsWithoutBoots,
    };

    return {
      fileName: `[ARAM] [${Sources.MurderBridge}] ${alias}`,
      title: `[ARAM] [${Sources.MurderBridge}] ${alias}`,
      type: 'custom',
      associatedMaps: [12], // aram
      associatedChampions: [+key],
      key: alias.toLowerCase(),
      champion: alias,
      map: 'any',
      mode: 'any',
      preferredItemSlots: [],
      sortrank: 9999,
      startedFrom: 'blank',
      blocks: [startBlocks, bootBlocks, buildBlocks].filter(Boolean),
    };
  };

  getChampData = async (champion, version) => {
    try {
      const $identity = uuid();
      this.dispatch(
        addFetching({
          $identity,
          champion,
          source: Sources.MurderBridge,
        }),
      );

      const res = await http.get(`${ApiPrefix}/save/${version}/ARAM/${champion}.json`, {
        cancelToken: new CancelToken((c) => {
          this.setCancelHook(`mr-${champion}`)(c);
        }),
      });

      this.dispatch(
        addFetched({
          $identity,
        }),
      );
      return res;
    } catch (err) {
      throw new Error(err);
    }
  };

  import = async () => {
    try {
      const version = await MurderBridge.getLolVersion();
      this.version = version;
      const championList = await Ddragon.getChampions(version);
      const tasks = Object.values(championList).map((champion) =>
        this.getChampData(champion.id, version).then((data) => {
          const { items } = data;
          const item = this.makeItemBuilds(items, champion);
          return saveToFile(this.lolDir, item);
        }),
      );
      const result = await Promise.all(tasks);
      this.dispatch(fetchSourceDone(Sources.MurderBridge));
      return result;
    } catch (err) {
      throw new Error(err);
    }
  };
}
