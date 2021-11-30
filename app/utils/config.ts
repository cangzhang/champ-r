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
    sourceList: DefaultSourceList,
    lolDirHasCJKChar: false,
    alwaysRequestLatestVersion: false,
  },
});
