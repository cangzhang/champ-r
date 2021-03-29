open Node
open Electron
open ElectronReloader
open ElectronContextMenu
open ElectronUtil
open ElectronStore
open NodeMachineId
open ElectronUpdater
open ElectronLog

open AppConfig
open AppLogger

type unhandledOption = {showDialog: bool}
type localWindow = ref<option<Electron.iBrowserWindow>>

@module external osLocale: unit => Js.Promise.t<string> = "os-locale"
@module external debug: unit => unit = "electron-debug"
@module external unhandled: unhandledOption => unit = "electron-unhandled"

type intervalID
@val external setInterval: (unit => unit, int) => intervalID = "setInterval"
@val external clearInterval: intervalID => unit = "clearInterval"

try {
  ElectronReloader.reloader(
    Node.module_,
    {
      watchRenderer: false,
      ignore: [],
    },
  )
} catch {
| Js.Exn.Error(obj) =>
  switch Js.Exn.message(obj) {
  | Some(_) => ()
  | None => ()
  }
}

AppLogger.init()

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

  let win = Electron.makeBrowserWindow(mWinOption)

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
      ? "http://127.0.0.1:3000"
      : "file://" ++ Node.join(Node.__dirname, "build/index.html"),
  )
  ->Js.Promise.then_(() => {
    let w = win->Js.Option.some
    mainWindow := w
    w->Js.Promise.resolve
  }, _)
}

let toggleMainWindow = () => {
  switch mainWindow.contents {
  | None => ()
  | Some(main) =>
    if main->Electron.isWindowVisible {
      main->Electron.hideWindow
      main->Electron.setSkipTaskbar(true)
    } else {
      main->Electron.showWindow
      main->Electron.setSkipTaskbar(false)
    }
  }
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

      let win = Electron.makeBrowserWindow(popupWinOption)

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
          ? "http://127.0.0.1:3000/popup.html"
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
  createMainWindow()->Js.Promise.then_((_) => {
    Js.Promise.resolve()
  }, _)
})

type iPopupData = {
  @optional championId: string,
  position: string,
}

let onChampionChange = (popup: Electron.iBrowserWindow, data: iPopupData) => {
  let id = ref(Js.Nullable.null)

  id := Js.Nullable.return(Js.Global.setInterval(() => {
        let isPopupVisible = popup->Electron.isWindowVisible
        if isPopupVisible {
          popup->Electron.getWebContents->Electron.sendToWebContents("for-popup", data)
          Js.Nullable.iter(id.contents, (. id) => Js.Global.clearInterval(id))
        }
      }, 300))
  ()
}

let lastChampion = ref(0)
let onShowPopup = (_, data: iPopupData) => {
  let championId = data.championId -> int_of_string
  let championChanged = championId > 0 && lastChampion.contents != championId

  switch championChanged {
  | false => Js.Promise.resolve()
  | true => {
      lastChampion := championId

      switch popupWindow.contents {
      | Some(popup) => {
          onChampionChange(popup, data)
          Js.Promise.resolve()
        }
      | None => createPopupWindow()->Js.Promise.then_(w => {
          popupWindow := w

          switch w {
          | None => ()
          | Some(popup) => {
              popup->Electron.showWindow
              popup->Electron.focusWindow

              onChampionChange(popup, data)
            }
          }

          Js.Promise.resolve()
        }, _)
      }
    }
  }
}

let registerMainListeners = () => {
  Electron.ipcMain->Electron.onIpcMainEvent("broadcast", (ev, data) => {
    ev->Electron.ipcEventSend(data["channel"], data)
  })

  Electron.ipcMain->Electron.onIpcMainEventPromise("show-popup", onShowPopup)

  Electron.ipcMain->Electron.onIpcMainEvent("hide-popup", (_, _) => {
    switch popupWindow.contents {
    | None => ()
    | Some(popup) => {
        lastChampion := 0
        if popup->Electron.isWindowVisible {
          popup->Electron.hideWindow
        }
      }
    }
  })

  Electron.ipcMain->Electron.onIpcMainEvent("toggle-main-window", (_, _) => {
    toggleMainWindow()
  })

  Electron.ipcMain->Electron.onIpcMainEvent("restart-app", (_, _) => {
    Electron.app->Electron.relaunch
    Electron.app->Electron.exit
  })

  Electron.ipcMain->Electron.onIpcMainEvent("popup:toggle-always-on-top", (_, _) => {
    switch popupWindow.contents {
    | None => ()
    | Some(popup) => {
        let next = !(popup->Electron.isAlwaysOnTop)
        popup->Electron.setAlwaysOnTop(next)
        popup->Electron.setSkipTaskbar(next)

        AppConfig.config->ElectronStore.setBool("popup.alwaysOnTop", next)
      }
    }
  })

  Electron.ipcMain->Electron.onIpcMainEvent("popup:reset-position", (_, _) => {
    switch mainWindow.contents {
    | None => ()
    | Some(main) => {
        let (mx, my) = main->Electron.getPosition
        let bounds =
          Electron.screen
          ->Electron.getDisplayNearestPoint({x: mx, y: my})
          ->Electron.getDisplayBounds
        let x = bounds.width / 2
        let y = bounds.height / 2

        AppConfig.config->ElectronStore.setBool("popup.alwaysOnTop", true)
        AppConfig.config->ElectronStore.setInt("popup.x", x)
        AppConfig.config->ElectronStore.setInt("popup.y", y)

        switch popupWindow.contents {
        | None => ()
        | Some(popup) => {
            popup->Electron.setAlwaysOnTop(true)
            popup->Electron.setPosition(x, y)
          }
        }
      }
    }
  })
}

let makeTray = () => {
  let iconPath = Node.join(
    ElectronUtil.is.development ? Node.__dirname : Node.resourcesPath,
    "resources/app-icon.png",
  )
  let icon =
    Electron.nativeImage
    ->Electron.createImageFromPath(iconPath)
    ->Electron.resizeImage({width: 24, height: 24})

  let tray = Electron.makeTray(icon)
  tray->Electron.setTooltip("ChampR")

  tray->Electron.onTrayEvent("clock", () => {
    toggleMainWindow()
  })

  let items: array<Electron.iMenuItem> = [
    {
      label: "Toggle window",
      click: () => toggleMainWindow(),
    },
    {
      label: "Exit",
      click: () => Electron.app->Electron.quit,
    },
  ]
  let trayMenu = Electron.menu->Electron.buildMenuFromTemplate(items)
  tray->Electron.setContextMenu(trayMenu)
}

let getMachineId = () => {
  let userId = AppConfig.config->ElectronStore.getString("userId", "")

  switch userId->Js.String.length {
  | 0 => userId->Js.Promise.resolve
  | _ => NodeMachineId.machineId()->Js.Promise.then_(id => {
      AppConfig.config->ElectronStore.setString("userId", id)
      Js.Promise.resolve(id)
    }, _)
  }
}

let isNetworkError = (msg: string) => {
  Js.String.includes("net::ERR_", msg)
}

let updateCheckIntv = 1000 * 60 * 60 * 2

let checkUpdateTask = () => {
  ElectronUpdater.autoUpdater->ElectronUpdater.checkForUpdates->Js.Promise.catch(err => {
    Js.log2("check update failed: ", err)->Js.Promise.resolve
  }, _)
}

let checkForUpdates = () => {
  switch ElectronUtil.is.development {
  | true => Js.log("Skipped update check for dev mode")->Js.Promise.resolve
  | false => {
      let _ = Js.Global.setInterval(() => {
        let _ = checkUpdateTask()
      }, updateCheckIntv)

      checkUpdateTask()
    }
  }
}

let registerUpdater = () => {
  ElectronUpdater.setLogger(ElectronUpdater.autoUpdater, ElectronLog.log)
  ElectronUpdater.setLogLevel(ElectronUpdater.autoUpdater, "info")
  ElectronUpdater.setAutoDownload(ElectronUpdater.autoUpdater, false)

  ElectronUpdater.autoUpdater->ElectronUpdater.onUpdaterEvent("checking-for-update", _ => {
    Js.log("Checking for update...")
  })
  ElectronUpdater.autoUpdater->ElectronUpdater.onUpdaterEvent("update-available", info => {
    Js.log("Update available: " ++ info.version)

    switch mainWindow.contents {
    | None => ()
    | Some(main) =>
      main->Electron.getWebContents->Electron.sendToWebContents("update-available", info)
    }
  })
  ElectronUpdater.autoUpdater->ElectronUpdater.onUpdaterEvent("update-not-available", info => {
    Js.Console.warn("Update not available: " ++ info.version)
  })
  ElectronUpdater.autoUpdater->ElectronUpdater.onUpdaterEvent("update-downloaded", info => {
    Js.log("Update downloaded: " ++ info.version)

    switch mainWindow.contents {
    | None => ()
    | Some(main) =>
      main->Electron.getWebContents->Electron.sendToWebContents("update-downloaded", info)
    }
  })
  ElectronUpdater.autoUpdater->ElectronUpdater.onUpdaterEvent("error", info => {
    Js.Console.error2("Error in auto-updater: ", info)
  })
  Electron.ipcMain->Electron.onIpcMainEvent("install-update", (_, _) => {
    ElectronUpdater.autoUpdater->ElectronUpdater.quitAndInstall(false)
  })
}

Js.log("ChampR starting...")

let _ = Electron.app->Electron.whenAppReady->Js.Promise.then_(() => {
    Electron.menu->Electron.setApplicationMenu(Js.Nullable.null)
    Js.Promise.resolve()
  }, _)->Js.Promise.then_(() => {
    Electron.app->Electron.getPath("userData")->Js.log
    osLocale()->Js.Promise.then_(locale => {
      let appLang = AppConfig.config->ElectronStore.getString("appLang", "")
      Js.log("locale: " ++ locale ++ ", app language: " ++ appLang)
      let finalLang = ref("en-US")

      if Js.String.length(appLang) == 0 {
        if locale == "zh-CN" || locale == "en-US" {
          finalLang := locale
        }
      } else if appLang == "en-US" && appLang == "zh-CN" {
        finalLang := appLang
      }
      AppConfig.config->ElectronStore.setString("appLang", finalLang.contents)
      // Js.log("locale: " ++ locale ++ ", app language: " ++ finalLang.contents)
      Js.Promise.resolve()
    }, _)
  }, _)->Js.Promise.then_(() => {
    createMainWindow()->Js.Promise.then_(_ => {
      createPopupWindow()->Js.Promise.then_(_ => {
        registerMainListeners()
        registerUpdater()
        Js.Promise.resolve()
      }, _)
    }, _)
  }, _)->Js.Promise.then_(() => {
    switch mainWindow.contents {
    | None => Js.Promise.resolve()
    | Some(main) => {
        let options = ElectronUtil.iCenterWindowOptions(~window=main, ~animated=true, ())
        ElectronUtil.centerWindow(options)
        Js.Promise.resolve()
      }
    }
  }, _)->Js.Promise.then_(() => {
    makeTray()
    Js.Promise.resolve()
  }, _)->Js.Promise.then_(() => {
    getMachineId()->Js.Promise.then_(userId => {
      Js.log("user id: " ++ userId)
      Js.Promise.resolve()
    }, _)
  }, _)->Js.Promise.then_(() => {
    checkForUpdates()->Js.Promise.then_(() => {
      Js.Promise.resolve()
    }, _)
  }, _)->Js.Promise.catch(err => {
    Js.Console.error2("got error: ", err)
    Js.Promise.resolve()
  }, _)
