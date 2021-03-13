open ElectronReloader
open ElectronContextMenu
open Electron
open AppConfig
open ElectronUtil
open ElectronStore

type unhandledOption = {showDialog: bool}
type localWindow = ref<Js.Nullable.t<Electron.iWindow>>

@val external nodeModule: 'a = "module"
@module("path") external join: (string, string) => string = "join"

@module external osLocale: unit => Js.Promise.t<string> = "os-locale"
@module("node-machine-id") external machineId: unit => Js.Promise.t<string> = "machineId"
@module external debug: unit => unit = "debug"
@module external unhandled: unhandledOption => unit = "electron-unhandled"

@module external logger: 'a = "./native/logger"

try {
  ElectronReloader.reloader(
    nodeModule,
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

let mainWindow: localWindow = ref(Js.Nullable.null)
let popupWindow: localWindow = ref(Js.Nullable.null)
// let tray = ref(Js.null)

let webPreference: Electron.iWebPreferences = {
  nodeIntegration: true,
  webSecurity: false,
  allowRunningInsecureContent: true,
  zoomFactor: 1,
  enableRemoteModule: true,
}

let createMainWindow = () => {
  let win = Js.Nullable.return(
    Electron.browserWindow({
      title: Electron.app->Electron.getName,
      show: false,
      frame: false,
      height: 650,
      width: ElectronUtil.is.development ? 1300 : 400,
      resizable: ElectronUtil.is.development,
      webPreferences: webPreference,
    }),
  )
}
