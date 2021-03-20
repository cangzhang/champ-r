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
  @send external hideWindow: iBrowserWindow => unit = "hide"
  @send external setSkipTaskbar: (iBrowserWindow, bool) => unit = "setSkipTaskbar"
  @send external isAlwaysOnTop: iBrowserWindow => bool = "isAlwaysOnTop"
  @send external setAlwaysOnTop: (iBrowserWindow, bool) => unit = "setAlwaysOnTop"
  @send external setPosition: (iBrowserWindow, int, int) => unit = "setPosition"

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
  @send external onAppEvent: (iApp, string, unit => 'a) => unit = "on"
  @send external onAppEventPromise: (iApp, string, unit => Js.Promise.t<'a>) => unit = "on"
  @send external relaunch: iApp => unit = "relaunch"
  @send external exit: iApp => unit = "exit"
  @send external whenAppReady: iApp => Js.Promise.t<'a> = "whenReady"
  @send external getPath: (iApp, string) => string = "getPath"

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

  type iIpcEvent
  @send external ipcEventSend: (iIpcEvent, string, 'a) => unit = "sender.send"

  type iIpcMain
  @send external onIpcMainEvent: (iIpcMain, string, (iIpcEvent, 'b) => unit) => unit = "on"
  @send
  external onIpcMainEventPromise: (iIpcMain, string, (iIpcEvent, 'b) => Js.Promise.t<'c>) => unit =
    "on"

  type iImageSize = {
    width: int,
    height: int,
  }
  type iNativeImage
  @send external createImageFromPath: (iNativeImage, string) => iNativeImage = "createFromPath"
  @send external resizeImage: (iNativeImage, iImageSize) => iNativeImage = "resize"

  type iMenuItem = {
    label: string,
    click: unit => unit,
  }

  type iMenu
  @send external buildMenuFromTemplate: (iMenu, array<iMenuItem>) => iMenu = "buildFromTemplate"
  @send external setApplicationMenu: (iMenu, 'a) => unit = "setApplicationMenu"

  type iTray
  @send external setTooltip: (iTray, string) => unit = "setToolTip"
  @send external onTrayEvent: (iTray, string, unit => 'a) => unit = "on"
  @send external setContextMenu: (iTray, iMenu) => unit = "setContextMenu"

  @module("electron") external app: iApp = "app"
  @new @module("electron")
  external makeBrowserWindow: iBrowserWindowOption => iBrowserWindow = "BrowserWindow"
  @module("electron") external nativeTheme: iNativeTheme = "nativeTheme"
  @module("electron") external screen: iScreen = "screen"
  @module("electron") external ipcMain: iIpcMain = "ipcMain"
  @module("electron") external nativeImage: iNativeImage = "nativeImage"
  @new @module("electron")
  external makeTray: iNativeImage => iTray = "Tray"
  @module("electron") external menu: iMenu = "Menu"
}
