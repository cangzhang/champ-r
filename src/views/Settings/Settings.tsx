import { invoke } from '@tauri-apps/api';
import { useEffect, useState } from 'react';

import { Label } from 'src/components/ui/Label';
import { Switch } from 'src/components/ui/Switch';

import { appConf } from 'src/config';

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
    appConf.get<boolean>(`autoStart`).then((s) => {
      setAutoStart(s);
    });
  }, []);

  return (
    <section>
      <div className={s.option}>
        <Switch
          id="auto-start"
          checked={autoStart}
          onCheckedChange={onChange}
        />
        <Label htmlFor="auto-start">Auto Start</Label>
      </div>
    </section>
  );
}
