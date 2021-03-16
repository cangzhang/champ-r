module ElectronStore = {
  type iStore
  @send external getString: (iStore, string) => string = "get"
  @send external getBool: (iStore, string) => bool = "get"
  @send external getInt: (iStore, string) => int = "get"
  @send external getObj: (iStore, string) => Js.Json.t = "get"
  @send external setInt: (iStore, string, int) => unit = "set"
  @send external setBool: (iStore, string, bool) => unit = "set"
  @send external setString: (iStore, string, string) => unit = "set"

  @new @module external store: 'a => iStore = "electron-store"
}
