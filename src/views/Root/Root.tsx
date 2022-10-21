import s from './style.module.scss';

import {
  HashRouter,
  Routes,
  Route,
} from 'react-router-dom';

import { Builds } from '../Builds/Builds';
import { Settings } from '../Settings/Settings';
import { NavMenu } from '../NavMenu/NavMenu';
import { ImportResult } from '../ImportResult/ImportResult';

export function Root() {
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
