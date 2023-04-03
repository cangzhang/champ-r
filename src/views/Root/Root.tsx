import s from './style.module.scss';

import { listen } from '@tauri-apps/api/event';

import { useEffect } from 'react';
import {
  HashRouter,
  Routes,
  Route,
} from 'react-router-dom';

import { useAppStore } from 'src/store';
import { blockKeyCombosInProd } from 'src/helper';

import { Builds } from 'src/views/Builds/Builds';
import { Settings } from 'src/views/Settings/Settings';
import { NavMenu } from 'src/views/NavMenu/NavMenu';
import { ImportResult } from 'src/views/ImportResult/ImportResult';

export function Root() {
  const toggleLcuStatus = useAppStore(s => s.toggleLcuStatus);

  useEffect(() => {
    blockKeyCombosInProd();
  }, []);

  useEffect(() => {
    let unlisten = () => {
    };
    listen(`webview::lol_running_status`, (data) => {
      const [running] = data.payload as any[];
      console.log('lcu running: ', running);
      toggleLcuStatus(running);
    }).then(un => {
      unlisten = un;
    });

    // return () => {
    //   unlisten();
    // };
  }, []);

  return (
    <HashRouter>
      <div className={s.container}>
        <NavMenu/>

        <Routes>
          <Route path={'/import'} element={<ImportResult/>}></Route>
          <Route path={'/settings'} element={<Settings/>}></Route>
          <Route path={'/'} element={<Builds/>}></Route>
        </Routes>
      </div>
    </HashRouter>
  );
}
