import _get from 'lodash/get';
import _find from 'lodash/find';
import _sortBy from 'lodash/sortBy'

import http from 'src/service/http';
import { saveToFile } from 'src/share/file';
// import { Actions } from 'src/share/actions';

const API = {
	List: `https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js`,
	Positions: `https://lol.qq.com/act/lbp/common/guides/guideschampion_position.js`,
	detail: id => `https://lol.qq.com/act/lbp/common/guides/champDetail/champDetail_${id}.js`,
	Items: `https://ossweb-img.qq.com/images/lol/act/img/js/items/items.js`,
};

export const parseCode = str => {
	try {
		const [result] = str.match(/{"(.*)"}/);
		const data = JSON.parse(result);
		return data;
	} catch (err) {
		return err;
	}
};

export const getItemList = async () => {
	try {
		const { items: itemList } = await http.get(API.Items);
		return itemList;
	} catch (err) {
		return err;
	}
};

export const getChampionList = async () => {
	try {
		const data = await http.get(API.List);
		return data;
	} catch (err) {
		return err;
	}
};

export const getChampionDetail = async id => {
	try {
		const apiUrl = API.detail(id);
		const code = await http.get(apiUrl);
		const { list } = parseCode(code);
		return list;
	} catch (err) {
		return err;
	}
};

export const getChampionPositions = async () => {
	try {
		const code = await http.get(API.Positions);
		const { list } = parseCode(code);
		return list;
	} catch (err) {
		return err;
	}
};

export const sortBlocks = (items, itemMap) => {
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

export const makeItem = ({ data, positions, champion, version, itemMap }) => {
	const { alias } = champion;
	const { championLane } = data;

	const result = positions.reduce((res, position) => {
		const laneItemsStr = _get(championLane, `${position}.hold3`, []);
		const rawBlocks = JSON.parse(laneItemsStr);
		const rawItems = rawBlocks.map(i => ({
			id: i.itemid,
			count: 1,
			pRate: i.showrate,
			wRate: i.winrate,
		}));
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
		] = sortBlocks(rawItems, itemMap);

		const item = {
			'sortrank': 1,
			priority: false,
			map: `any`,
			mode: `any`,
			type: `custom`,
			key: alias.toLowerCase(),
			champion: alias,
			position,
			title: `[LOL.QQ.COM] ${position} - ${version}`,
			fileName: `[LOL.QQ.COM]${alias}-${position}-${version}`,
			skills: [],
			// TODO: boots
			blocks: [
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
			],
		};

		return res.concat(item);
	}, []);

	return result;
};

export default async function getItems(lolDir, itemMap) {
	try {
		const [
			{
				version,
				hero: list,
			},
			positionMap,
		] = await Promise.all([
			getChampionList(),
			getChampionPositions(),
		]);

		const championIds = Object.keys(positionMap);
		const tasks = championIds.map(getChampionDetail);
		const detailList = await Promise.all(tasks);

		const items = detailList.reduce((res, item, idx) => {
			const id = championIds[idx];
			const positions = Object.keys(positionMap[id]);
			const champion = _find(list, { heroId: id });

			const block = makeItem({
				data: item,
				positions,
				champion,
				version,
				itemMap,
			});
			return res.concat(block);
		}, []);

		const fileTasks = items.map(i => saveToFile(lolDir, i));
		const result = await Promise.all(fileTasks);

		return result;
	} catch (err) {
		return err;
	}
}
