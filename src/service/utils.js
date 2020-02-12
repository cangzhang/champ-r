import cheerio from 'cheerio';
import http from './http';

export const requestHtml = async (url) => {
	try {
		const rawHtml = await http.get(
			url,
			// get partial html
			{
				headers: { 'X-Requested-With': 'XMLHttpRequest' },
			},
		);
		const $ = cheerio.load(rawHtml);
		return $;
	} catch (err) {
		return err;
	}
};
