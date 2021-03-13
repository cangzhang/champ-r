module ElectronReloader = {
  type electronReloaderOptions = {
    ignore: array<string>,
    watchRenderer: bool,
  }
  
  @module external reloader: ('a, electronReloaderOptions) => unit = "electron-reloader"
}
