import http from './http';

export const DDragonCDNUrl = `https://ddragon.leagueoflegends.com/cdn`;

export const getLolVer = async () => {
	const resp = await http.get(`https://ddragon.leagueoflegends.com/realms/na.json`);
	return resp.v;
};

export const getChampions = async (ver, region = `en_US`) => {
	const { data } = await http.get(`https://ddragon.leagueoflegends.com/cdn/${ver}/data/${region}/champion.json`);
	return data;
};
