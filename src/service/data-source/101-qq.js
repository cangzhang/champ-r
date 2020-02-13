import _get from 'lodash/get';

import http from 'src/service/http';

// import { saveToFile } from 'src/share/file';
// import { Actions } from 'src/share/actions';

// const vm = require('vm');
// const context = {
// 	CHAMPION_POSITION: {
// 		list: {},
// 		gameVer: ``,
// 	},
// };
// vm.createContext(context);
// export const runCode = (code, varName) => {
// 	vm.runInContext(code, context);
// 	return context[varName];
// };

const API = {
	List: `https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js`,
	Positions: `https://lol.qq.com/act/lbp/common/guides/guideschampion_position.js`,
	detail: id => `https://lol.qq.com/act/lbp/common/guides/champDetail/champDetail_${id}.js`,
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

export const makeItem = (data, positions) => {
	const { championLane } = data;
	const blocks = positions.map(p => {
		const laneItemsStr = _get(championLane, `${p}.hold3`, []);
		const laneItems = JSON.parse(laneItemsStr);
		return laneItems;
	});

	return blocks;
};

export default async function getItems() {
	try {
		const positionMap = await getChampionPositions();
		const championIds = Object.keys(positionMap);
		const tasks = championIds.map(getChampionDetail);
		const detailList = await Promise.all(tasks);

		const items = detailList.map((item, idx) => {
			const id = championIds[idx];
			const positions = Object.keys(positionMap[id]);
			return makeItem(item, positions);
		});

		return items;
	} catch (err) {
		return err;
	}
}
