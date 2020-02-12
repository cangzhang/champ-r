import { requestHtml } from './utils';

const OpggUrl = `https://www.op.gg`;

export const getPositions = async () => {
	const $ = await requestHtml(`${OpggUrl}/champion/statistics`);

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

export const genChampionData = async (championName, position, version) => {
	if (!championName || !position)
		return Promise.reject(`Please specify champion & position.`);

	try {
		const [blocks, skills] = await Promise.all([
			genBlocks(championName, position),
			genSkills(championName, position),
		]);

		return {
			'sortrank': 1,
			priority: false,
			map: `any`,
			mode: `any`,
			type: `custom`,
			key: championName,
			champion: championName,
			position,
			title: `[OP.GG] ${position} - ${version}`,
			fileName: `[op.gg]${championName}-${position}-${version}`,
			skills,
			blocks,
		};
	} catch (err) {
		return err;
	}
};

// TODO: sort
export const genBlocks = async (champion, position) => {
	try {
		const $ = await requestHtml(`${OpggUrl}/champion/${champion}/statistics/${position}/item`);

		const itemTable = $(`.l-champion-statistics-content__side .champion-stats__table`)[0];
		const blocks = $(itemTable)
			.find(`tbody tr`)
			.toArray()
			.map(tr => {
				const [itemTd, pRateTd, wRateTd] = $(tr).find(`td`).toArray();
				const itemId = $(itemTd).find(`img`).attr(`src`).match(/(.*)\/(.*)\.png/).pop();
				const pRate = $(pRateTd).find(`em`).text().replace(',', '');
				const wRate = $(wRateTd).text().replace(`%`, '');

				return {
					id: itemId,
					count: 1,
					pRate,
					wRate,
				};
			});

		return blocks;
	} catch (err) {
		return err;
	}
};

export const genSkills = async (champion, position) => {
	try {
		const $ = await requestHtml(`${OpggUrl}/champion/${champion}/statistics/${position}/skill`);

		const skills = $(`.champion-stats__filter__item .champion-stats__list`)
			.toArray()
			.map(i =>
				$(i).find(`.champion-stats__list__item`)
					.toArray()
					.map(j => $(j).text().trim()),
			);

		return skills;
	} catch (err) {
		return err;
	}
};
