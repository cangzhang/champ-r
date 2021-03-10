open ElectronReloader
// open ElectronUtil
open ElectronContextMenu

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

debug()
unhandled({showDialog: false})
ElectronContextMenu.contextMenu()
