import s from './style.module.scss';

import React, { useEffect, useState } from 'react';
import { useHistory } from 'react-router-dom';
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
const getLangItem = value => LangList.find(i => i.value === value) || {};

export default function Settings() {
  const history = useHistory();
  const sysLang = config.get(`appLang`);
  const [values, setLangValues] = useState([getLangItem(sysLang)]);

  const onSelectLang = param => {
    setLangValues(param.value);
  };

  useEffect(() => {
    config.set(`appLang`, values[0].value);
  }, [values]);

  return <div className={s.settings}>
    <div className={s.lang}>
      <label>App language</label>
      <Select
        placeholder={`Select language`}
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
      }}
    >
      Back
    </Button>
  </div>;
}
