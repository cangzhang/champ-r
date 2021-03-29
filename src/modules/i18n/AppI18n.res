module AppI18n = {
  open I18n
  open AppConfig
  open ElectronStore

  @module("./en-us") external enLang: string = "lang"
  @module("./en-us") external enUS: I18n.iI18nResource = "default"
  @module("./zh-cn") external cnLang: string = "lang"
  @module("./zh-cn") external zhCN: I18n.iI18nResource = "default"

  let init = () => {
    let appLang = AppConfig.config->ElectronStore.getString("appLang", enLang)

    let makeResources = () => {
      let resources = Js.Dict.empty()
      resources->Js.Dict.set(enLang, enUS)
      resources->Js.Dict.set(cnLang, zhCN)
      resources
    }

    let config = I18n.iI18nConfig(
      ~lng=appLang,
      ~fallbackLng=enLang,
      ~interpolation=I18n.iInterpolation(~escapeValue=false),
      ~resources=makeResources(),
    )

    let _ = ReactI18next.initReactI18next->I18n.use->I18n.init(config)
  }
}
