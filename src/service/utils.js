import cheerio from 'cheerio';
import http from './http';

export const requestHtml = async (url) => {
	const rawHtml = await http.get(url);
	const $ = cheerio.load(rawHtml);
	return $;
};
