import _find from 'lodash/find';
import _sortBy from 'lodash/sortBy';
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

export const sortBlocksByRate = (items, itemMap) => {
	const { tags: StarterTags } = _find(itemMap.tree, { header: `START` });
	const startItems = [];
	const incompleteItems = [];
	const completedItems = [];
	const boots = [];

	for (const i of items) {
		const itemDetail = itemMap.data[i.id];

		const isBoot = itemDetail.tags.includes(`Boots`);
		if (isBoot) {
			boots.push(i);
			continue;
		}

		const isStartItem = itemDetail.tags.some(t => StarterTags.includes(t.toUpperCase()));
		const isInCompleteItem = !isStartItem && itemDetail.into;
		const isCompletedItem = !isStartItem && !itemDetail.into;

		isStartItem && startItems.push(i);
		isInCompleteItem && incompleteItems.push(i);
		isCompletedItem && completedItems.push(i);
	}

	const sortByPickRate = [startItems, incompleteItems, completedItems, boots].map(i => _sortBy(i, [`pRate`]));
	const sortByWinRate = [startItems, incompleteItems, completedItems, boots].map(i => _sortBy(i, [`wRate`]));

	return [sortByPickRate, sortByWinRate];
};

export const genFileBlocks = (rawItems, itemMap) => {
	const [
		[
			pStartItems,
			pIncompleteItems,
			pCompletedItems,
			pBoots,
		],
		[
			wStartItems,
			wIncompleteItems,
			wCompletedItems,
			wBoots,
		],
	] = sortBlocksByRate(rawItems, itemMap);

	return [
		{
			type: `Starter Items | by pick rate`,
			items: pStartItems,
		},
		{
			type: `Starter Items | by win rate`,
			items: wStartItems,
		},
		{
			type: `Incomplete | by pick rate`,
			items: pIncompleteItems,
		},
		{
			type: `Incomplete | by win rate`,
			items: wIncompleteItems,
		},
		{
			type: `Completed | by pick rate`,
			items: pCompletedItems,
		},
		{
			type: `Completed | by win rate`,
			items: wCompletedItems,
		},
		{
			type: `Boots | by pick rate`,
			items: pBoots,
		},
		{
			type: `Boots | by win rate`,
			items: wBoots,
		},
	];
};
