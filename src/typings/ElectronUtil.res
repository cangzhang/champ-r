module ElectronUtil = {
  open Electron

  type t

  type isProp = {
    development: bool,
    macos: bool,
  }

  @deriving(abstract)
  type iCenterWindowOptions = {
    window: Electron.iBrowserWindow,
    @optional animated: bool,
  }

  @module("electron-util") @val external is: isProp = "is"
  @module("electron-util") external centerWindow: iCenterWindowOptions => unit = "centerWindow"
}
