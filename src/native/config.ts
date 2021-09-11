import Store from 'electron-store';
import { DefaultSourceList } from '../share/constants/sources';

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
    sourceList: DefaultSourceList,
    lolDirHasCJKChar: false,
  },
});

export default appStore;
