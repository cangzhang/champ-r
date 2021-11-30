import Store from 'electron-store';
import { DefaultSourceList } from '../constants/sources';

export const appConfig = new Store({
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
    statistics: {
      width: 400,
      height: 650,
      x: null,
      y: null,
      alwaysOnTop: false,
    },
    sourceList: DefaultSourceList,
    lolDirHasCJKChar: false,
  },
});
