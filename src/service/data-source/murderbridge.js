import SourceProto from 'src/service/data-source/source-proto';
import http from 'src/service/http';

const ApiPrefix = `https://d23wati96d2ixg.cloudfront.net`;

function scorer(winRate, frequency, mean, spread) {
  if (frequency === 0) {
    return 0;
  }
  const e = 2.71828;
  let score = 1 / (1 + e ** ((spread / 30) * (mean - frequency)));
  if (frequency < 0.25) {
    score *= frequency ** 2;
  }
  if (frequency > mean) {
    return frequency ** (1 / spread) * winRate ** (spread ** 0.1) * score;
  }
  return winRate * score;
}

function scoreGenerator(winRate, frequency, mean, settings) {
  let adjustedMean = mean || 2.5;
  adjustedMean = settings && settings.mean ? settings.mean : adjustedMean;
  return scorer(winRate, frequency, adjustedMean, 100 - settings.ratio);
}

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
