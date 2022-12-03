import { appWindow } from '@tauri-apps/api/window';

import cn from 'classnames';
import { IconMinus, IconX } from '@tabler/icons';

import Logo from '../../assets/icon.png';

import s from './style.module.scss';

export function Toolbar() {
  return (
    <div data-tauri-drag-region className={s.titlebar}>
      <div className={s.appName}>
        <img src={Logo}/>
        <span className={s.name}>ChampR</span>
      </div>
      
      <div className={s.titlebarBtn} onClick={() => appWindow.minimize()}>
        <IconMinus size={20}/>
      </div>
      <div className={cn(s.titlebarBtn, s.warn)} onClick={() => appWindow.hide()}>
        <IconX size={20}/>
      </div>
    </div>
  );
}
