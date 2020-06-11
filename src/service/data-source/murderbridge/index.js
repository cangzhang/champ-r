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

export default class MurderBridge extends SourceProto {
  constructor() {
    super();
    this.version = null;
  }

  getLatestVersion = async () => {
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
      const version = await this.getLatestVersion();
      const [{ runes }, reforgedRunes] = await Promise.all([
        this.getChampData(champion, version),
        Ddragon.getRunesReforged(version),
      ]);
      const runesLookUp = runeLookUpGenerator(reforgedRunes);
      const perks = generateOptimalPerks(null, null, runes, runesLookUp);
      return perks.map((i) => ({
        ...i,
        alias: champion,
      }));
    } catch (err) {
      // throw new Error(err);
    }
  };

  makeItemBuilds = ({ starting }) => {
    const startItems = Object.entries(starting)
      .sort((a, b) => {
        return (
          scoreGenerator(b[1].winRate, b[1].frequency, 2.5, generalSettings) -
          scoreGenerator(a[1].winRate, a[1].frequency, 2.5, generalSettings)
        );
      })
      .slice(0, 3)
      .map((i) => JSON.parse(i[0]))
      .reduce((ids, cur) => {
        cur.forEach((i) => {
          ids.add(i[0]);
        });
        return ids;
      }, new Set())
      .map((i) => ({
        id: i,
        count: 1,
      }));

    // TODO
    // eslint-disable-next-line no-unused-vars
    const startBlocks = {
      type: `Starters`,
      items: startItems,
      showIfSummonerSpell: '',
      hideIfSummonerSpell: '',
    };
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
      const version = await this.getLatestVersion();
      this.version = version;

      return version;
    } catch (err) {
      throw new Error(err);
    }
  };
}
