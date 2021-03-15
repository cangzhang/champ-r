open Node
open Electron
open ElectronReloader
open ElectronContextMenu
open ElectronUtil
open ElectronStore
open AppConfig

type unhandledOption = {showDialog: bool}
type localWindow = ref<option<Electron.iBrowserWindow>>

@module external osLocale: unit => Js.Promise.t<string> = "os-locale"
@module("node-machine-id") external machineId: unit => Js.Promise.t<string> = "machineId"
@module external debug: unit => unit = "debug"
@module external unhandled: unhandledOption => unit = "electron-unhandled"

@module external logger: 'a = "./native/logger"

try {
  ElectronReloader.reloader(
    Node.module_,
    {
      watchRenderer: false,
      ignore: ["./src/**/*"],
    },
  )
} catch {
| Js.Exn.Error(obj) =>
  switch Js.Exn.message(obj) {
  | Some(_) => ()
  | None => ()
  }
}

unhandled({showDialog: false})
debug()
ElectronContextMenu.contextMenu()

Electron.nativeTheme.themeSource = "light"
Electron.app->Electron.setAppUserModelId("com.al.champ-r")
Electron.app->Electron.allowRendererProcessReuse(false)
Electron.app
->Electron.getCommandLine
->Electron.appendSwitchString("ignore-certificate-errors", "true")
Electron.app
->Electron.getCommandLine
->Electron.appendSwitchString("disable-features", "OutOfBlinkCors")

let ignoreSystemScale = AppConfig.config->ElectronStore.getBool(`ignoreSystemScale`)
if ignoreSystemScale {
  Electron.app->Electron.getCommandLine->Electron.appendSwitchInt("high-dpi-support", 1)
  Electron.app->Electron.getCommandLine->Electron.appendSwitchInt("force-device-scale-factor", 1)
}

let mainWindow: localWindow = ref(None)
let popupWindow: localWindow = ref(None)
// let tray = ref(Js.null)

let webPreference: Electron.iWebPreferences = {
  nodeIntegration: true,
  webSecurity: false,
  allowRunningInsecureContent: true,
  zoomFactor: 1,
  enableRemoteModule: true,
}

let createMainWindow = () => {
  let win = Electron.browserWindow({
    title: Electron.app->Electron.getName,
    show: false,
    frame: false,
    height: 650,
    width: ElectronUtil.is.development ? 1300 : 400,
    resizable: ElectronUtil.is.development,
    webPreferences: webPreference,
  })

  win->Electron.onWindowEvent("ready-to-show", () => {
    win->Electron.showWindow
  })

  win->Electron.onWindowEvent("closed", () => {
    mainWindow := None
    mainWindow := None
  })

  win
  ->Electron.loadURL(
    ElectronUtil.is.development
      ? "http://0.0.0.0:3000"
      : "file://" ++ Node.join(Node.__dirname, "build/index.html"),
  )
  ->Js.Promise.then_(() => Js.Promise.resolve(win), _)
}

let createPopupWindow = () => {
  switch mainWindow.contents {
  | None => ()
  | Some(mainWin) => {
      let (mX, mY) = mainWin->Electron.getPosition
      let curDisplay = Electron.screen->Electron.getDisplayNearestPoint({x: mX, y: mY})
      let popupConfig = AppConfig.config->ElectronStore.getJson("popup")
      let popupWin = Electron.browserWindow({
        show: false,
        frame: false,
        resizable: true,
        webPreferences: webPreference,
        // skipTaskbar: popupConfig.alwaysOnTop,
        // alwaysOnTop: popupConfig.alwaysOnTop,
        // width: popupConfig.width || 300,
        // height: popupConfig.height || 350,
        // x: popupConfig.x || (
        //   isDev ? curDisplay.bounds.width / 2 : curDisplay.bounds.width - 500 - 140
        // ),
        // y: popupConfig.y || curDisplay.bounds.height / 2,
      })
    }
  }
}
