import { requestHtml } from './utils';

const OpggUrl = `https://www.op.gg`;

export const getPositions = async () => {
	const $ = await requestHtml(`${ OpggUrl }/champion/statistics`);

	const items = $(`.champion-index__champion-list`)
		.find(`.champion-index__champion-item`);
	const result = items
		.toArray()
		.map(itm => {
			const champ = $(itm);
			const { championKey, championName } = champ.data();
			const positions = champ.find(`.champion-index__champion-item__position`)
				.toArray()
				.map(i => $(i).text().toLowerCase());
			// todo: champion avatar
			// const avatar = champ.find(`.champion-index__champion-item__image`)

			return {
				key: championKey,
				name: championName,
				positions: positions.slice(),
			};
		});

	return result;
};

export const getSpellName = (imgSrc = '') => {
	const matched = imgSrc.match(/(.*)\/Summoner(.*)\.png/) || [''];
	return matched.pop();
};

export const getItems = async (championName, position) => {
	if (!championName || !position)
		return Promise.reject(`Please specify champion & position.`);

	const $ = await requestHtml(`${ OpggUrl }/champion/${ championName }/statistics/${ position }`);
	const overviewTables = $(`.champion-overview__table.champion-overview__table--summonerspell tbody`);

	const spells = overviewTables.eq(0).find(`tr`)
		.toArray()
		.map(item => {
			const imgs = $(item).find(`.champion-stats__list__item img`);
			const src = imgs.map((idx, i) => $(i).attr(`src`));
			return src.toArray();
		});
	const skills = overviewTables.eq(1)
		.find(`.champion-stats__list`)
		.find(`.champion-stats__list__item`).text().trim().replace(/\s+/g, '>');

	const spellNames = spells.map(arr => arr.map(getSpellName));
	const data = {
		key: championName,
		position,
		spells,
		spellNames,
		skills,
	};
	console.log(data);
	return data;
};

