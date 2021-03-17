module Electron = {
  type iRectangle = {
    height: int,
    width: int,
    x: int,
    y: int,
  }

  type iBrowserWindow
  type iBrowserWindowWebContents
  @send external onWindowEvent: (iBrowserWindow, string, unit => unit) => unit = "on"
  @send external showWindow: iBrowserWindow => unit = "show"
  @send external loadURL: (iBrowserWindow, string) => Js.Promise.t<unit> = "loadURL"
  @send external getPosition: iBrowserWindow => (int, int) = "getPosition"
  @get external getWindowBounds: iBrowserWindow => iRectangle = "getBounds"
  @send external isMinimized: iBrowserWindow => bool = "isMinimized"
  @send external restoreWindow: iBrowserWindow => unit = "restore"
  @send external focusWindow: iBrowserWindow => unit = "focus"
  @send external isWindowVisible: iBrowserWindow => bool = "isVisible"
  @get external getWebContents: iBrowserWindow => iBrowserWindowWebContents = "webContents"
  @send external sendToWebContents: (iBrowserWindowWebContents, string, 'a) => unit = "send"

  type iNativeTheme = {mutable themeSource: string}

  type iAppCommandLine
  @send external appendSwitchString: (iAppCommandLine, string, string) => unit = "appendSwitch"
  @send external appendSwitchInt: (iAppCommandLine, string, int) => unit = "appendSwitch"

  type iApp
  @send external setAppUserModelId: (iApp, string) => unit = "setAppUserModelId"
  @set external allowRendererProcessReuse: (iApp, bool) => unit = "allowRendererProcessReuse"
  @get external getCommandLine: iApp => iAppCommandLine = "commandLine"
  @get external getName: iApp => string = "name"
  @send external requestSingleInstanceLock: iApp => bool = "requestSingleInstanceLock"
  @send external quit: iApp => unit = "quit"
  @send external onAppEvent: (iApp, string, () => 'a) => unit = "on"
  @send external onAppEventPromise: (iApp, string, () => Js.Promise.t<'a>) => unit = "on"

  @deriving(abstract)
  type iWebPreferences = {
    nodeIntegration: bool,
    webSecurity: bool,
    allowRunningInsecureContent: bool,
    zoomFactor: int,
    enableRemoteModule: bool,
  }

  @deriving(abstract)
  type iBrowserWindowOption = {
    @optional title: string,
    @optional show: bool,
    @optional frame: bool,
    @optional height: int,
    @optional width: int,
    @optional resizable: bool,
    @optional webPreferences: iWebPreferences,
    @optional fullscreenable: bool,
    @optional skipTaskbar: bool,
    @optional alwaysOnTop: bool,
    @optional x: int,
    @optional y: int,
  }

  type iDisplay
  @get external getDisplayBounds: iDisplay => iRectangle = "bounds"

  type point = {
    x: int,
    y: int,
  }

  type iScreen
  @send external getDisplayNearestPoint: (iScreen, point) => iDisplay = "getDisplayNearestPoint"

  @module("electron") external app: iApp = "app"
  @new @module("electron")
  external browserWindow: iBrowserWindowOption => iBrowserWindow = "BrowserWindow"
  @module("electron") external screen: iScreen = "screen"

  @module("electron") external menu: 'a = "menu"
  @module("electron") external ipcMain: 'a = "ipcMain"
  @module("electron") external tray: 'a = "Tray"
  @module("electron") external nativeImage: 'a = "nativeImage"
  @module("electron") external nativeTheme: iNativeTheme = "nativeTheme"
}
