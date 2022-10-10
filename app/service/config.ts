import Store from 'electron-store';
import { DefaultSourceList, DEFAULT_NPM_REGISTRY } from '../constants/sources';

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
    enableChinaCDN: false,
    startMinimized: false,
    npm_registry: DEFAULT_NPM_REGISTRY,
    onlyShowSelectedSourcesInPopup: false,
  },
});
