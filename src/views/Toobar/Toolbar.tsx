import { appWindow } from '@tauri-apps/api/window';

import { IconMinus, IconX } from '@tabler/icons'

import s from './style.module.scss';

export function Toolbar() {
    return (
        <div data-tauri-drag-region className={s.titlebar}>
            <div className={s.titlebarBtn} onClick={() => appWindow.minimize()}>
                <IconMinus size={20} />
            </div>
            <div className={s.titlebarBtn} onClick={() => appWindow.close()}>
                <IconX size={20} />
            </div>
        </div>
    )
}
