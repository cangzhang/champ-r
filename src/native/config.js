const Store = require('electron-store');
const appVersion = require('electron').remote.app.getVersion();

module.exports = new Store({
  defaults: {
    lolDir: '',
    lolVer: '',
    language: '',
    keepOldItems: true,
    appVersion,
  },
});
