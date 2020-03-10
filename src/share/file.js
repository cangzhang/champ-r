const fse = require('fs-extra');
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
		await fse.outputFile(file, JSON.stringify(content, null, 4));
		return true;
	} catch (err) {
		return err;
	}
};

export const removeFolderContent = async dir => {
	try {
		await fse.emptyDir(dir);
		return true;
	} catch (err) {
		return err;
	}
};
