import { Container, Switch, SwitchEvent } from '@nextui-org/react';
import { invoke } from '@tauri-apps/api';
import { useCallback, useEffect, useState } from 'react';

import { appConf } from 'src/config';

import s from './style.module.scss';

export function Settings() {
  const [autoStart, setAutoStart] = useState(false);
  const [keepOldBuilds, setKeepOldBuilds] = useState(false);

  const onToggleAutoStart = useCallback(async (ev: SwitchEvent) => {
    const v = ev.target.checked;
    setAutoStart(v);

    invoke('update_app_auto_start', { autoStart: v });
    await appConf.set(`autoStart`, v);
    await appConf.save();
  }, []);

  const onToggleKeepOldBuilds = useCallback(async (ev: SwitchEvent) => {
    const v = ev.target.checked;
    setKeepOldBuilds(v);

    await appConf.set('keepOldBuilds', v);
    await appConf.save();
  }, []);

  useEffect(() => {
    appConf.get<boolean>(`autoStart`).then((s) => {
      setAutoStart(Boolean(s));
    });
    appConf.get<boolean>('keepOldBuilds').then((s) => {
      setKeepOldBuilds(Boolean(s));
    });
  }, []);

  return (
    <Container className={s.container}>
      <div className={s.option}>
        <Switch checked={autoStart} onChange={onToggleAutoStart} />
        Auto start
      </div>
      <div className={s.option}>
        <Switch checked={keepOldBuilds} onChange={onToggleKeepOldBuilds} />
        Keep old builds
      </div>
    </Container>
  );
}
