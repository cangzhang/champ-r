import { invoke } from '@tauri-apps/api';
import { UnlistenFn, listen } from '@tauri-apps/api/event';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { blockKeyCombosInProd } from 'src/helper';
import { Source } from 'src/interfaces';
import { useAppStore } from 'src/store';

import { Builds } from '../Builds/Builds';
import { ImportResult } from '../ImportResult/ImportResult';
import { NavMenu } from '../NavMenu/NavMenu';
import { Settings } from '../Settings/Settings';

export function Root() {
  const { toggleLcuStatus, setSources } = useAppStore();

  useEffect(() => {
    blockKeyCombosInProd();
  }, []);

  useEffect(() => {
    let unlisten: UnlistenFn;
    listen(`webview::lol_running_status`, (data) => {
      const [running] = data.payload as any[];
      console.log('lcu running: ', running);
      toggleLcuStatus(running);
    }).then((un) => {
      unlisten = un;
    });

    return () => {
      unlisten();
    };
  }, [toggleLcuStatus]);

  useEffect(() => {
    invoke(`init_server_data`);

    let unlisten: UnlistenFn;
    listen(`webview::server_data`, (ev) => {
      const payload = ev.payload as any[];
      console.log(payload);
      setSources(payload[1] as Source[]);
      invoke(`set_page_data`, { data: payload });
      invoke(`watch_lcu`);
    }).then((un) => {
      unlisten = un;
    });

    return () => {
      unlisten();
    };
  }, [setSources]);

  return (
    <HashRouter>
      <div className={clsx('container flex h-screen')}>
        <NavMenu />

        <Routes>
          <Route path={'/import'} element={<ImportResult />}></Route>
          <Route path={'/settings'} element={<Settings />}></Route>
          <Route path={'/'} element={<Builds />}></Route>
        </Routes>
      </div>
    </HashRouter>
  );
}
