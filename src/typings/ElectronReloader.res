type electronReloaderOptions = {
  ignore: array<string>,
  watchRenderer: bool,
}

module ElectronReloader = {
  @module external reloader: ('a, electronReloaderOptions) => unit = "electron-reloader"
}
