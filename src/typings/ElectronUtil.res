type t

type isProp = {
  development: bool,
  macos: bool,
}

type centerWindowOptions = {
  animated: bool,
  window: t,
}

module ElectronUtil = {
  @module("electron-util") @val external is: isProp = "is"
  @module("electron-util") @val external centerWindow: centerWindowOptions => unit = "centerWindow"
}
