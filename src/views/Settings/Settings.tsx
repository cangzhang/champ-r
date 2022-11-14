import { invoke } from '@tauri-apps/api';

import { useEffect, useState } from 'react';
import { Container, Switch, SwitchEvent } from '@nextui-org/react';

import { appConf } from '../../config';

import s from './style.module.scss';

export function Settings() {
  const [autoStart, setAutoStart] = useState(false);

  const onChange = (ev: SwitchEvent) => {
    let v = ev.target.checked;
    setAutoStart(v);

    invoke('update_app_auto_start', { autoStart });

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
    <Container className={s.container}>
      <div className={s.option}>
        <Switch
          checked={autoStart}
          onChange={onChange}
        />
        Auto Start
      </div>
    </Container>
  );
}
