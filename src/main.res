open ElectronReloader
open ElectronContextMenu
open Electron
open AppConfig
// open ElectronUtil

type unhandledOption = {showDialog: bool}

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
Electron.app.setAppUserModelId("com.al.champ-r")
Electron.app.commandLine.appendSwitch("ignore-certificate-errors", "true")
Electron.app.commandLine.appendSwitch("disable-features", "OutOfBlinkCors")
Electron.app.allowRendererProcessReuse = false

let ignoreSystemScale: bool = AppConfig.config.getBool(`ignoreSystemScale`);
