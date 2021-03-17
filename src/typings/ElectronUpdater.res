module ElectronUpdater = {
  type iAppUpdater
  @send external checkForUpdates: iAppUpdater => Js.Promise.t<string> = "checkForUpdates"

  @module("electron-updater") external autoUpdater: iAppUpdater = "autoUpdater"
}
