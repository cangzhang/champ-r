/* eslint react-hooks/exhaustive-deps: 0 */
import s from './style.module.scss';

import { ipcRenderer } from 'electron';

import _get from 'lodash/get';
import React, { useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Select } from 'baseui/select';
import { Button } from 'baseui/button';
import { Checkbox, STYLE_TYPE } from 'baseui/checkbox';

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
  const [ignoreSystemScale, setIgnoreSystemScale] = useState(config.get(`ignoreSystemScale`));

  const recorder = useRef(false);

  const onSelectLang = (param) => {
    setLangValues(param.value);
  };

  const restartApp = () => {
    ipcRenderer.send(`restart-app`);
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
                  marginLeft: `3em`,
                };
              },
            },
          }}
        />
      </div>

      <Checkbox
        checked={ignoreSystemScale}
        checkmarkType={STYLE_TYPE.toggle_round}
        onChange={(e) => {
          setIgnoreSystemScale(e.currentTarget.checked);
          config.set(`ignoreSystemScale`, e.currentTarget.checked);
          recorder.current = true;
        }}
        overrides={{
          Root: {
            style: () => ({
              height: `48px`,
              display: `flex`,
              alignItems: `center`,
              marginTop: `1em`,
            }),
          },
          Label: {
            style: ({ $theme }) => {
              return {
                fontSize: $theme.typography.ParagraphMedium,
              };
            },
          },
        }}>
        {t(`ignore system scale`)}
      </Checkbox>

      <div className={s.ctrlBtns}>
        <Button onClick={() => history.replace(`/`)}>{t(`back to home`)}</Button>
        {recorder.current && <Button onClick={restartApp}>{t(`restart app`)}</Button>}
      </div>
    </div>
  );
}
