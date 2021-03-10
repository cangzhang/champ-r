type t

module ElectronStore = {
  @new @module external store : 'a => t = "electron-store"
}