import http from 'src/service/http';
import SourceProto from 'src/service/data-source/source-proto';
import { scoreGenerator, generalSettings } from './constants';

const ApiPrefix = `https://d23wati96d2ixg.cloudfront.net`;

export default class MurderBridge extends SourceProto {
  constructor() {
    super();
  }

  getLatestVersion = async () => {
    try {
      const res = await http.get(`${ApiPrefix}/save/general.json`);
      return res.upToDateVersion;
    } catch (err) {
      throw new Error(err);
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
