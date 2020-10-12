const _upperFirst = require('lodash/upperFirst');
const http = require('./http');

const DDragonCDNUrl = 'https://ddragon.leagueoflegends.com/cdn';

const getLolVer = async () => {
  const resp = await http.get(`https://ddragon.leagueoflegends.com/api/versions.json`);
  return resp[0];
};

const getChampions = async (ver, region = 'en_US') => {
  const { data } = await http.get(`${DDragonCDNUrl}/${ver}/data/${region}/champion.json`);
  return data;
};

const getSpellImg = (spell, ver) =>
  `${DDragonCDNUrl}/${ver}/img/spell/Summoner${_upperFirst(spell)}.png`;

const getItemIcon = (id, ver) => `${DDragonCDNUrl}/${ver}/img/item/${id}.png`;

const getItemList = (version, language = 'en_US') =>
  http.get(`${DDragonCDNUrl}/${version}/data/${language}/item.json`);

const getRunesReforged = (version, language = `en_US`) =>
  http.get(`${DDragonCDNUrl}/${version}/data/${language}/runesReforged.json`);

module.exports = {
  getLolVer,
  getChampions,
  getSpellImg,
  getItemIcon,
  getItemList,
  DDragonCDNUrl,
  getRunesReforged,
};
