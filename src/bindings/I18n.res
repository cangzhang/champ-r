module I18n = {
  type iI18nContext
  type iResource<'a> = Js.Json.t
  
  @deriving(abstract)
  type iInterpolation = {
    escapeValue: bool,
  }

  @deriving(abstract)
  type iI18nConfig = {
    lng: string,
    fallbackLng: string,
    interpolation: iInterpolation,
    resources: iResource<Js.Json.t>,
  }

  type iI18n
  @send external init: (iI18n, 'a) => iI18n = "init"

  @module("i18nNext") external use: iI18nContext => iI18n = "use"
}

module ReactI18next = {
  @module("react-i18next") external initReactI18next: I18n.iI18nContext = "initReactI18next"
}
