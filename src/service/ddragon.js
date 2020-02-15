import _upperFirst from 'lodash/upperFirst';
import http from './http';

export const ChampionNames = [
	{
		key: `drmundo`,
		name: `DrMundo`,
	},
	{
		key: `jarvaniv`,
		name: `JarvanIV`,
	},
	{
		key: `leesin`,
		name: `LeeSin`,
	},
	{
		key: `masteryi`,
		name: `MasterYi`,
	},
	{
		key: `tahmkench`,
		name: `TahmKench`,
	},
	{
		key: `xinzhao`,
		name: `XinZhao`,
	},
	{
		key: `missfortune`,
		name: `MissFortune`,
	},
	{
		key: `twistedfate`,
		name: `TwistedFate`,
	},
	{
		key: `reksai`,
		name: `RekSai`,
	},
	{
		key: `aurelionsol`,
		name: `AurelionSol`,
	},
	{
		key: `kogmaw`,
		name: `KogMaw`,
	},
];

export const DDragonCDNUrl = `https://ddragon.leagueoflegends.com/cdn`;

export const getLolVer = async () => {
	const resp = await http.get(`https://ddragon.leagueoflegends.com/api/versions.json`);
	return resp[0];
};

export const getChampions = async (ver, region = `en_US`) => {
	const { data } = await http.get(`https://ddragon.leagueoflegends.com/cdn/${ver}/data/${region}/champion.json`);
	return data;
};

export const getAvatar = (_name, ver) => {
	const champ = ChampionNames.find(i => i.key === _name) || {};
	const name = _upperFirst(champ.name || _name);
	return `${DDragonCDNUrl}/${ver}/img/champion/${name}.png`;
};

export const getSpellImg = (spell, ver) => `${DDragonCDNUrl}/${ver}/img/spell/Summoner${_upperFirst(spell)}.png`;

export const getItemIcon = (id, ver) => `${DDragonCDNUrl}/${ver}/img/item/${id}.png`;

export const getItemList = (version, language = `en_US`) => http.get(`${DDragonCDNUrl}/${version}/data/${language}/item.json`);

