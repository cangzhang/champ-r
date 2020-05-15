import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import config from 'src/native/config';
import enUS, { lang as enLang } from './en-us';
import zhCN, { lang as cnLang } from './zh-cn';

i18n.use(initReactI18next).init({
  lng: config.get(`appLang`) || enLang,
  fallbackLng: enLang,
  interpolation: {
    escapeValue: false,
  },

  resources: {
    [enLang]: enUS,
    [cnLang]: zhCN,
  },
});
