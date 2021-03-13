open ElectronStore

module AppConfig = {
  type popupProp = {
    width: int,
    height: int,
    x: int,
    y: int,
    alwaysOnTop: bool,
  }

  type localStoreProp = {
    userId: string,
    lolDir: string,
    appendGameToDir: bool,
    lolVer: string,
    appLang: string,
    keepOldItems: bool,
    ignoreSystemScale: bool,
    selectedSources: array<string>,
    perkTab: string,
    popup: popupProp,
  }

  type storeProp = {defaults: localStoreProp}

  let defaultConfig: storeProp = {
    defaults: {
      userId: "",
      lolDir: "",
      appendGameToDir: false,
      lolVer: "",
      appLang: "",
      keepOldItems: true,
      ignoreSystemScale: false,
      selectedSources: [],
      perkTab: "",
      popup: {
        width: 0,
        height: 0,
        x: 0,
        y: 0,
        alwaysOnTop: true,
      },
    },
  }

  let config = ElectronStore.store(defaultConfig)
}
