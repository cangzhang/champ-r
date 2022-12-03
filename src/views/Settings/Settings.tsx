import { invoke } from '@tauri-apps/api';

import { useEffect, useState } from 'react';
import { Switch, Content } from '@adobe/react-spectrum'

import { appConf } from '../../config';

import s from './style.module.scss';

export function Settings() {
  const [autoStart, setAutoStart] = useState(false);

  const onChange = (v: boolean) => {
    setAutoStart(v);
    
    invoke('update_app_auto_start', { autoStart: v });
    appConf.set(`autoStart`, v).then(() => {
      appConf.save();
    });
  };

  useEffect(() => {
    appConf.get<boolean>(`autoStart`).then(s => {
      setAutoStart(s);
    });
  }, []);

  return (
    <Content UNSAFE_className={s.container}>
      <div className={s.option}>
        <Switch
          isSelected={autoStart}
          onChange={onChange}
        />
        Auto Start
      </div>
    </Content>
  );
}
