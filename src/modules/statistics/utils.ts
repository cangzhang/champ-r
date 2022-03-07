import { IChampionRank } from '@interfaces/commonTypes';
const cheerio = require('cheerio');
const axios = require('axios');

async function getIChampionRankAsync_() {
  const response = await axios.get('http://www.op.gg/champion/statistics', {
    headers: {
      'Content-Language': 'en-US',
      'Accept-Language': 'en-US',
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.9',
    },
  });
  const $ = cheerio.load(response.data);
  let top: IChampionRank[] = fetchChampionRank($, 'tbody.champion-trend-tier-TOP > tr');
  let jungle: IChampionRank[] = fetchChampionRank($, 'tbody.champion-trend-tier-JUNGLE > tr');
  let middle: IChampionRank[] = fetchChampionRank($, 'tbody.champion-trend-tier-MID > tr');
  let bottom: IChampionRank[] = fetchChampionRank($, 'tbody.champion-trend-tier-ADC > tr');
  let support: IChampionRank[] = fetchChampionRank($, 'tbody.champion-trend-tier-SUPPORT > tr');
  return [top, jungle, middle, bottom, support];
}

function fetchChampionRank(jqElement: any, selector: string): IChampionRank[] {
  let IChampionRank: IChampionRank[] = [];
  let CompatibleNaming: { [key: string]: string } = {
    'Nunu & Willump': 'Nunu',
    'Lee Sin': 'LeeSin',
    'Xin Zhao': 'XinZhao',
    "Rek'Sai": 'RekSai',
    'Master Yi': 'MasterYi',
    "Kha'Zix": 'Khazix',
    'Jarvan IV': 'JarvanIV',
    'Tahm Kench': 'TahmKench',
    'Dr. Mundo': 'DrMundo',
    Wukong: 'MonkeyKing',
    "Cho'Gath": 'Chogath',
    LeBlanc: 'Leblanc',
    'Twisted Fate': 'TwistedFate',
    'Aurelion Sol': 'AurelionSol',
    'Miss Fortune': 'MissFortune',
    "Kai'Sa": 'Kaisa',
    "Kog'Maw": 'KogMaw',
    "Vel'Koz": 'Velkoz',
  };
  jqElement(selector).each(function (index: number, element: Element) {
    const id: string = jqElement(element)
      .children()
      .eq(3)
      .children()
      .eq(0)
      .children()
      .eq(0)
      .text()
      .trim();
    IChampionRank.push({
      version: '',
      rank: jqElement(element).children().eq(0).text().trim(),
      id: CompatibleNaming.hasOwnProperty(id) ? CompatibleNaming[id] : id,
      position: jqElement(element)
        .children()
        .eq(3)
        .children()
        .eq(0)
        .children()
        .eq(1)
        .text()
        .trim()
        .replace(new RegExp('\t', 'g'), ''),
      winRate: jqElement(element).children().eq(4).text().trim(),
      pickRate: jqElement(element).children().eq(5).text().trim(),
      tier: jqElement(element).children().eq(6).find('img').eq(0).attr('src'),
    });
  });
  return IChampionRank;
}

export const getIChampionRankAsync = getIChampionRankAsync_;
