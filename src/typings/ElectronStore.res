type t

type iStore = {
  getString: string => string,
  getBool: string => bool,
  set: (string, t) => unit,
}

module ElectronStore = {
  @new @module external store : 'a => iStore = "electron-store"
}
