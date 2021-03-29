module ElectronUpdater = {
  type iUpdateInfo = {
    version: string,
  }

  type iAppUpdater
  @send external checkForUpdates: iAppUpdater => Js.Promise.t<'a> = "checkForUpdates"
  @set external setLogger: (iAppUpdater, 'a) => unit = "logger"
  @set external setLogLevel: (iAppUpdater, string) => unit = "logger.transports.file.level"
  @set external setAutoDownload: (iAppUpdater, bool) => unit = "autoDownload"
  @send external onUpdaterEvent: (iAppUpdater, string, (iUpdateInfo) => 'a) => unit = "on"
  @send external quitAndInstall: (iAppUpdater, bool) => unit = "quitAndInstall"

  @module("electron-updater") external autoUpdater: iAppUpdater = "autoUpdater"
}
