/* eslint react-hooks/exhaustive-deps: 0 */
import s from './style.module.scss';

import _get from 'lodash/get';
import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Select } from 'baseui/select';
import { Button } from 'baseui/button';

import config from 'src/native/config';

const LangList = [
  {
    label: 'English (US)',
    value: 'en-US',
  },
  {
    label: 'Chinese (CN)',
    value: 'zh-CN',
  },
];
const getLangItem = (value) => LangList.find((i) => i.value === value) || {};

export default function Settings() {
  const [t, i18n] = useTranslation();
  const history = useHistory();
  const sysLang = config.get(`appLang`);
  const [values, setLangValues] = useState([getLangItem(sysLang)]);

  const onSelectLang = (param) => {
    setLangValues(param.value);
  };

  useEffect(() => {
    const lang = _get(values, `0.value`, sysLang);
    if (lang !== sysLang) {
      config.set(`appLang`, lang);
      i18n.changeLanguage(lang);
    }
  }, [values]);

  return (
    <div className={s.settings}>
      <div className={s.lang}>
        <label>{t(`display language`)}</label>
        <Select
          placeholder={t(`select language`)}
          options={LangList}
          labelKey={'label'}
          valueKey={'value'}
          value={values}
          onChange={onSelectLang}
          overrides={{
            Root: {
              style: () => {
                return {
                  display: `flex`,
                  alignSelf: `flex-end`,
                  flexGrow: 1,
                  flexShrink: 0,
                  flexBasis: 0,
                  marginLeft: `1em`,
                };
              },
            },
          }}
        />
      </div>

      <Button
        onClick={() => history.replace(`/`)}
        overrides={{
          BaseButton: {
            style: () => {
              return {
                width: `14em`,
                display: `flex`,
                margin: `2em auto`,
              };
            },
          },
        }}>
        {t(`back to home`)}
      </Button>
    </div>
  );
}
