const Store = require('electron-store');

module.exports = new Store({
  defaults: {
    userId: '',
    lolDir: '',
    lolVer: '',
    appLang: '',
    keepOldItems: true,
    ignoreSystemScale: false,
    selectedSources: [],
    perkTab: ``,
  },
});
