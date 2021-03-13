module Electron = {
  type iWindow = {
    on: (string, unit) => unit,
    show: unit => unit,
  }

  type iNativeTheme = {mutable themeSource: string}

  type iAppCommandLine
  @send external appendSwitchString: (iAppCommandLine, string, string) => unit = "appendSwitch"
  @send external appendSwitchInt: (iAppCommandLine, string, int) => unit = "appendSwitch"

  type iApp
  @send external setAppUserModelId: (iApp, string) => unit = "setAppUserModelId"
  @set external allowRendererProcessReuse: (iApp, bool) => unit = "allowRendererProcessReuse"
  @get external getCommandLine: (iApp) => iAppCommandLine = "commandLine"
  @get external getName: (iApp) => string = "name"

  type iWebPreferences = {
    nodeIntegration: bool,
    webSecurity: bool,
    allowRunningInsecureContent: bool,
    zoomFactor: int,
    enableRemoteModule: bool,
  }

  type iBrowserWindowOption = {
    title: string,
    show: bool,
    frame: bool,
    height: int,
    width: int,
    resizable: bool,
    webPreferences: iWebPreferences,
  }

  @module("electron") external app: iApp = "app"
  @new @module("electron") external browserWindow: iBrowserWindowOption => iWindow = "BrowserWindow"
  @module("electron") external menu: 'a = "menu"
  @module("electron") external ipcMain: 'a = "ipcMain"
  @module("electron") external screen: 'a = "screen"
  @module("electron") external tray: 'a = "Tray"
  @module("electron") external nativeImage: 'a = "nativeImage"
  @module("electron") external nativeTheme: iNativeTheme = "nativeTheme"
}
