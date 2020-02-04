const path = require('path');
const fs = require('fs');

export const saveToFile = async (desDir, data) => {
	try {
		const date = +Date.now();
		const random = Math.floor(Math.random() * 1000);
		const file = `${desDir}/abc/${random}.txt`;

		await fs.promises.mkdir(path.dirname(file), {
			recursive: true
		});
		await fs.promises.writeFile(file, `hey there, ${date}`);
		return true;
	} catch (err) {
		return err
	}
};
