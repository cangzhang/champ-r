const path = require('path');
const fs = require('fs');
const _pick = require('lodash/pick');

export const saveToFile = async (desDir, data) => {
	try {
		const content = _pick(data, [
			'title',
			'map',
			'mode',
			'type',
			'priority',
			'sortrank',
			'blocks',
		]);

		const file = `${desDir}/Game/Config/Champions/${data.key}/Recommended/${data.fileName}.json`;

		await fs.promises.mkdir(path.dirname(file), {
			recursive: true
		});
		await fs.promises.writeFile(file, JSON.stringify(content, null, 4));
		return true;
	} catch (err) {
		return err
	}
};
