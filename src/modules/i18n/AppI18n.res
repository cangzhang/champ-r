module AppI18n = {
  open I18n
  open AppConfig
  open ElectronStore

  @module("./en-us") external enLang: string = "lang"
  @module("./en-us") external enUS: 'a = "enUS"
  @module("./zh-cn") external cnLang: string = "lang"
  @module("./zh-cn") external zhCN: 'a = "zhCN"

  let init = () => {
    let appLang = AppConfig.config->ElectronStore.getString("appLang", enLang)
    let config = I18n.iI18nConfig(
      ~lng=appLang,
      ~fallbackLng=enLang,
      ~interpolation=I18n.iInterpolation(~escapeValue=false),
      // TODO: resources
      // ~resouces=r,
    )

    let i18nInstance = ReactI18next.initReactI18next->I18n.use
    // i18nInstance->I18n.init()
  }
}
