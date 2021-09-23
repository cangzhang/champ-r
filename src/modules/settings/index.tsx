/* eslint react-hooks/exhaustive-deps: 0 */
import s from './style.module.scss';

import _get from 'lodash/get';
import React, { useEffect, useState, useRef, FormEvent } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { Select } from 'baseui/select';
import { Button } from 'baseui/button';
import { Checkbox, STYLE_TYPE } from 'baseui/checkbox';

import { LanguageSet } from 'src/native/langs';

interface ILangItem {
  label: string;
  value: string;
}

const LangList: ILangItem[] = [
  {
    label: 'English (US)',
    value: LanguageSet.enUS,
  },
  {
    label: 'Chinese (CN)',
    value: LanguageSet.zhCN,
  },
  {
    label: 'French (FR)',
    value: LanguageSet.frFR,
  },
];
const getLangItem = (value: string) => LangList.find((i) => i.value === value);

export default function Settings() {
  const [t, i18n] = useTranslation();
  const history = useHistory();
  const sysLang = window.bridge.appConfig.get(`appLang`);
  const [values, setLangValues] = useState<ILangItem[]>([getLangItem(sysLang) ?? LangList[0]]);
  const [ignoreSystemScale, setIgnoreSystemScale] = useState(
    window.bridge.appConfig.get(`ignoreSystemScale`),
  );

  const recorder = useRef(false);

  const onSelectLang = (param: any) => {
    setLangValues(param.value);
  };

  const restartApp = () => {
    window.bridge.sendMessage(`restart-app`);
  };

  const onIgnoreScale = (e: FormEvent<HTMLInputElement>) => {
    setIgnoreSystemScale(e.currentTarget.checked);
    window.bridge.appConfig.set(`ignoreSystemScale`, e.currentTarget.checked);
    window.bridge.sendMessage(`popup:reset-position`);
    recorder.current = true;
  };

  useEffect(() => {
    const lang = _get(values, `0.value`, sysLang);
    if (lang !== sysLang) {
      window.bridge.appConfig.set(`appLang`, lang);
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
        onChange={onIgnoreScale}
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
                fontWeight: 600,
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
