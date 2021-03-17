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

type intervalID
@val external setInterval: (unit => unit, int) => intervalID = "setInterval"
@val external clearInterval: intervalID => unit = "clearInterval"

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
// let lastChampion = ref(None)

let webPreference = Electron.iWebPreferences(
  ~nodeIntegration=true,
  ~webSecurity=false,
  ~allowRunningInsecureContent=true,
  ~zoomFactor=1,
  ~enableRemoteModule=true,
)

let createMainWindow = () => {
  let mWinOption = Electron.iBrowserWindowOption(
    ~title=Electron.app->Electron.getName,
    ~show=false,
    ~frame=false,
    ~height=650,
    ~width=ElectronUtil.is.development ? 1300 : 400,
    ~resizable=ElectronUtil.is.development,
    ~webPreferences=webPreference,
    (),
  )

  let win = Electron.browserWindow(mWinOption)

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
  ->Js.Promise.then_(() => {
    win->Js.Promise.resolve
  }, _)
}

let persistPopupConfig = (win: Electron.iBrowserWindow) => {
  let bounds = win->Electron.getWindowBounds
  AppConfig.config->ElectronStore.setInt("popup.x", bounds.x)
  AppConfig.config->ElectronStore.setInt("popup.y", bounds.y)
  AppConfig.config->ElectronStore.setInt("popup.width", bounds.width)
  AppConfig.config->ElectronStore.setInt("popup.height", bounds.height)
}

let createPopupWindow = () => {
  switch mainWindow.contents {
  | None => Js.Promise.resolve(None)
  | Some(mainWin) => {
      let (mX, mY) = mainWin->Electron.getPosition
      let curDisplay = Electron.screen->Electron.getDisplayNearestPoint({x: mX, y: mY})

      let popupW = AppConfig.config->ElectronStore.getInt("popup.width")
      let popupH = AppConfig.config->ElectronStore.getInt("popup.height")
      let keepTop = AppConfig.config->ElectronStore.getBool("popup.alwaysOnTop")
      let popupX = AppConfig.config->ElectronStore.getInt("popup.x")
      let popupY = AppConfig.config->ElectronStore.getInt("popup.y")
      let bounds = curDisplay->Electron.getDisplayBounds

      let popupWinOption = Electron.iBrowserWindowOption(
        ~show=false,
        ~frame=false,
        ~resizable=true,
        ~webPreferences=webPreference,
        ~skipTaskbar=keepTop,
        ~alwaysOnTop=keepTop,
        ~width=popupW > 0 ? popupW : 300,
        ~height=popupH > 0 ? popupH : 350,
        ~x=popupX > 0
          ? popupX
          : ElectronUtil.is.development
          ? bounds.width / 2
          : bounds.width - 500 - 140,
        ~y=popupY > 0 ? popupY : bounds.height / 2,
        (),
      )

      let win = Electron.browserWindow(popupWinOption)

      win->Electron.onWindowEvent("move", () => {
        persistPopupConfig(win)
      })
      win->Electron.onWindowEvent("resize", () => {
        persistPopupConfig(win)
      })
      win->Electron.onWindowEvent("closed", () => {
        popupWindow := None
      })

      win
      ->Electron.loadURL(
        ElectronUtil.is.development
          ? "http://0.0.0.0:3000/popup.html"
          : "file://" ++ Node.join(Node.__dirname, "build/popup.html"),
      )
      ->Js.Promise.then_(() => {
        win->Js.Option.some->Js.Promise.resolve
      }, _)
    }
  }
}

if !(Electron.app->Electron.requestSingleInstanceLock) {
  Electron.app->Electron.quit
}

Electron.app->Electron.onAppEventPromise("second-instance", () => {
  switch mainWindow.contents {
  | None => Js.Promise.resolve()
  | Some(win) => {
      if win->Electron.isMinimized {
        win->Electron.restoreWindow
      }

      win->Electron.showWindow->Js.Promise.resolve
    }
  }
})

Electron.app->Electron.onAppEvent("quit", () => {
  mainWindow := None
  popupWindow := None
})

Electron.app->Electron.onAppEvent("window-all-closed", () => {
  if !ElectronUtil.is.macos {
    Electron.app->Electron.quit
  }
})

Electron.app->Electron.onAppEventPromise("activate", () => {
  createMainWindow()->Js.Promise.then_(w => {
    mainWindow := Js.Option.some(w)
    Js.Promise.resolve()
  }, _)
})

type iPopupData = {
  @optional championId: int,
  position: string,
}

let requestPopupChange = (popup: Electron.iBrowserWindow, data: iPopupData) => {
  let id = ref(Js.Nullable.null)

  id := Js.Nullable.return(Js.Global.setInterval(() => {
        let isPopupVisible = popup->Electron.isWindowVisible
        if !isPopupVisible {
          ()
        }

        popup->Electron.getWebContents->Electron.sendToWebContents("for-popup", data)
        Js.Nullable.iter(id.contents, (. id) => Js.Global.clearInterval(id))
      }, 300))
  ()
}

let lastChampion = ref(0)
let onShowPopup = (_, data: iPopupData) => {
  let championChanged = data.championId <= 0 || lastChampion.contents == data.championId
  switch championChanged {
  | false => Js.Promise.resolve()
  | true => {
      lastChampion := data.championId

      switch popupWindow.contents {
      | Some(popup) => {
          requestPopupChange(popup, data)
          Js.Promise.resolve()
        }
      | None => createPopupWindow()->Js.Promise.then_(w => {
          popupWindow := w

          switch w {
          | None => ()
          | Some(popup) => {
              popup->Electron.showWindow
              popup->Electron.focusWindow

              requestPopupChange(popup, data)
            }
          }

          Js.Promise.resolve()
        }, _)
      }
    }
  }
}
