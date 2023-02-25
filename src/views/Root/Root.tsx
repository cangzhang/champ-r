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

import {
  Menubar,
  MenubarContent,
  MenubarItem,
  MenubarMenu,
  MenubarSeparator,
  MenubarShortcut,
  MenubarTrigger,
} from "src/components/ui/Menubar"

import { Builds } from '../Builds/Builds';
import { Settings } from '../Settings/Settings';
import { NavMenu } from '../NavMenu/NavMenu';
import { ImportResult } from '../ImportResult/ImportResult';

export function Root() {
  let toggleLcuStatus = useAppStore(s => s.toggleLcuStatus);

  useEffect(() => {
    blockKeyCombosInProd();
  }, []);

  useEffect(() => {
    let unlisten = () => {
    };
    listen(`webview::lol_running_status`, (data) => {
      let [running] = data.payload as any[];
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
