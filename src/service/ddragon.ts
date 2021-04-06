import _upperFirst from 'lodash/upperFirst';
import http from './http';
import { IChampionInfo } from 'src/typings/commonTypes'

export const DDragonCDNUrl = 'https://ddragon.leagueoflegends.com/cdn';

export const getLolVer = async () => {
  const resp = await http.get(`https://ddragon.leagueoflegends.com/api/versions.json`);
  return resp[0];
};

export const getChampions = async (ver: string, region = 'en_US') => {
  const { data }: { data: { [key: string]: IChampionInfo } } = await http.get(`${DDragonCDNUrl}/${ver}/data/${region}/champion.json`);
  return data;
};

export const getSpellImg = (spell: string, ver: string) =>
  `${DDragonCDNUrl}/${ver}/img/spell/Summoner${_upperFirst(spell)}.png`;

export const getItemIcon = (id: string | number, ver: string) => `${DDragonCDNUrl}/${ver}/img/item/${id}.png`;

export const getItemList = (version: string, language = 'en_US') =>
  http.get(`${DDragonCDNUrl}/${version}/data/${language}/item.json`);

export const getRunesReforged = (version: string, language = `en_US`) =>
  http.get(`${DDragonCDNUrl}/${version}/data/${language}/runesReforged.json`);
