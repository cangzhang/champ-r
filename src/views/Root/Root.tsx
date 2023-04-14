import { invoke } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';
import { useEffect } from 'react';
import { HashRouter, Route, Routes } from 'react-router-dom';

import { Builds } from 'src/views/Builds/Builds';
import { ImportResult } from 'src/views/ImportResult/ImportResult';
import { NavMenu } from 'src/views/NavMenu/NavMenu';
import { Settings } from 'src/views/Settings/Settings';

import { blockKeyCombosInProd } from 'src/helper';
import { useAppStore } from 'src/store';

import s from './style.module.scss';

export function Root() {
  const { toggleLcuStatus } = useAppStore();

  useEffect(() => {
    blockKeyCombosInProd();
  }, []);

  useEffect(() => {
    invoke('check_if_lol_running');
    invoke('init_page_data');
  }, []);

  useEffect(() => {
    listen(`webview::lol_running_status`, (data) => {
      const [running] = data.payload as [boolean];
      toggleLcuStatus(running);
    });
  }, []);

  return (
    <HashRouter>
      <div className={s.container}>
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
