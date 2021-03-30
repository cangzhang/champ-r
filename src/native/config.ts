import Store from 'electron-store';

const appStore = new Store({
  defaults: {
    userId: '',
    lolDir: '',
    appendGameToDir: false,
    lolVer: '',
    appLang: '',
    keepOldItems: true,
    ignoreSystemScale: false,
    selectedSources: [],
    perkTab: ``,
    popup: {
      width: null,
      height: null,
      x: null,
      y: null,
      alwaysOnTop: true,
    },
  },
});

export default appStore
