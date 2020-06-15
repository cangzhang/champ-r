import http from 'src/service/http';
import SourceProto from 'src/service/data-source/source-proto';
import * as Ddragon from 'src/service/ddragon';
import {
  scoreGenerator,
  generalSettings,
  generateOptimalPerks,
  runeLookUpGenerator,
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
  constructor() {
    super();
    this.version = null;
  }

  getLolVersion = async () => {
    try {
      const { upToDateVersion } = await http.get(`${ApiPrefix}/save/general.json`);
      this.version = upToDateVersion;
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
      const version = await this.getLolVersion();
      const [{ runes }, reforgedRunes] = await Promise.all([
        this.getChampData(champion, version),
        this.getRunesReforged(version),
      ]);
      const runesLookUp = runeLookUpGenerator(reforgedRunes);
      const perks = generateOptimalPerks(null, null, runes, runesLookUp);
      return perks.map((i) => ({
        ...i,
        alias: champion,
      }));
    } catch (err) {
      throw new Error(err);
    }
  };

  // TODO
  makeItemBuilds = ({ starting, build, order, counter }) => {
    const startItems = getItems(starting, 3);
    const startBlocks = {
      type: `Starters`,
      showIfSummonerSpell: '',
      hideIfSummonerSpell: '',
      items: startItems,
    };

    const buildItems = getItems(build, 10);
    const buildBlocks = {
      type: `Build`,
      showIfSummonerSpell: '',
      hideIfSummonerSpell: '',
      items: buildItems,
    };

    const counterItems = getItems(counter, 10);
    const counterBlocks = {
      type: `Build`,
      showIfSummonerSpell: '',
      hideIfSummonerSpell: '',
      items: counterItems,
    };

    const orderItems = getItems(order, 10);
    const orderBlocks = {
      type: `Build`,
      showIfSummonerSpell: '',
      hideIfSummonerSpell: '',
      items: orderItems,
    };

    console.log(startBlocks, buildBlocks, counterBlocks, orderBlocks);
  };

  getChampData = async (champion, version) => {
    try {
      const res = await http.get(`${ApiPrefix}/save/${version}/ARAM/${champion}.json`);
      return res;
    } catch (err) {
      throw new Error(err);
    }
  };

  import = async () => {
    try {
      const version = await this.getLolVersion();
      const championList = await Ddragon.getChampions(version);
      const tasks = Object.values(championList).map(({ id }) =>
        this.getChampData(id, version).then((data) => {
          const { items } = data;
          this.makeItemBuilds(items);
        }),
      );
      await Promise.all(tasks);
    } catch (err) {
      throw new Error(err);
    }
  };
}
