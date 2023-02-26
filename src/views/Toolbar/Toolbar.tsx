import { IconMinus, IconX } from '@tabler/icons';
import { appWindow } from '@tauri-apps/api/window';
import cn from 'clsx';

import Logo from 'src/assets/icon.png';

import s from './style.module.scss';

export function Toolbar() {
  return (
    <div data-tauri-drag-region className={s.titlebar}>
      <div className={s.appName}>
        <div className={'flex w-6'}>
          <img alt={''} src={Logo} />
        </div>
        <span className={s.name}>ChampR</span>
      </div>

      <div className={s.titlebarBtn} onClick={() => appWindow.minimize()}>
        <IconMinus size={20} />
      </div>
      <div
        className={cn(s.titlebarBtn, s.warn)}
        onClick={() => appWindow.hide()}
      >
        <IconX size={20} />
      </div>
    </div>
  );
}
