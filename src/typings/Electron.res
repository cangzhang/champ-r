type iNativeTheme = {
  mutable themeSource: string,
 }

type iAppCommandLine = {
  appendSwitch: (string, string) => unit,
}

 type iApp = {
   setAppUserModelId: string => unit,
   commandLine: iAppCommandLine,
   mutable allowRendererProcessReuse: bool,
 }

module Electron = {
  @module("electron") external app: iApp = "app"
  @module("electron") external browserWindow: 'a = "BrowserWindow"
  @module("electron") external menu: 'a = "menu"
  @module("electron") external ipcMain: 'a = "ipcMain"
  @module("electron") external screen: 'a = "screen"
  @module("electron") external tray: 'a = "Tray"
  @module("electron") external nativeImage: 'a = "nativeImage"
  @module("electron") external nativeTheme: iNativeTheme = "nativeTheme"
}
