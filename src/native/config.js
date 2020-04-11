const Store = require('electron-store');

module.exports = new Store({
  defaults: {
    lolDir: '',
    lolVer: '',
    appLang: '',
    keepOldItems: true,
    selectedSources: [],
    itemMap: {},
    championMap: {},
  },
});
