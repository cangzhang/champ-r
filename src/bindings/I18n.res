module I18n = {
  type iI18nContext
  type iI18nResource

  @deriving(abstract)
  type iInterpolation = {
    escapeValue: bool,
  }

  @deriving(abstract)
  type iI18nConfig = {
    lng: string,
    fallbackLng: string,
    interpolation: iInterpolation,
    resources: Js.Dict.t<iI18nResource>,
  }

  type iI18n
  @send external init: (iI18n, 'a) => iI18n = "init"

  @module("i18nNext") external use: iI18nContext => iI18n = "use"
}

module ReactI18next = {
  @module("react-i18next") external initReactI18next: I18n.iI18nContext = "initReactI18next"
}
