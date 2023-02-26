import { UnlistenFn, listen } from '@tauri-apps/api/event';
import { clsx } from 'clsx';
import { useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { blockKeyCombosInProd } from 'src/helper';
import { useAppStore } from 'src/store';

import { Builds } from '../Builds/Builds';
import { ImportResult } from '../ImportResult/ImportResult';
import { NavMenu } from '../NavMenu/NavMenu';
import { Settings } from '../Settings/Settings';

export function Root() {
  const toggleLcuStatus = useAppStore((s) => s.toggleLcuStatus);

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
