module ElectronStore = {
  type t<'a, 'b, 'c, 'd> = 
  | String('a)
  | Bool('b)
  | Json('c)
  | Int('d)

  type data = t<string, bool, Js.Json.t, int>

  type iStore
  @send external getString: (iStore, string) => string = "get"
  @send external getBool: (iStore, string) => bool = "get"
  @send external getInt: (iStore, string) => int = "get"
  @send external getJson: (iStore, string) => Js.Json.t = "get"

  @new @module external store: 'a => iStore = "electron-store"
}
