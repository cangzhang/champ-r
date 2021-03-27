module AppLogger = {
  type electronUtilIs = {development: bool}
  @val external console: 'a = "console"

  open ElectronUtil
  open ElectronLog

  let init = () => {
    if ElectronUtil.is.development {
      let _ = Js.Obj.assign(console, ElectronLog.functions)
    }
  }
}
