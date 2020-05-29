import http from 'src/service/http';
import SourceProto from 'src/service/data-source/source-proto';

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

  getChampData = async (champion, version) => {
    try {
      const res = await http.get(`${ApiPrefix}/save/${version}/ARAM/${champion}.json`);
    } catch (err) {
      throw new Error(err);
    }
  };

  import = async () => {
    try {
      const version = await this.getLatestVersion();
      return version;
    } catch (err) {
      throw new Error(err);
    }
  };
}
