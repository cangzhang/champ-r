const Store = require('electron-store');

module.exports = new Store({
	defaults: {
		lolDir: ``,
		lolVer: ``,
		language: ``,
		keepOldItems: true,
	},
});
