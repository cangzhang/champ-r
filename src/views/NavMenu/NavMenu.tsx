import s from './style.module.scss';

import { listen } from '@tauri-apps/api/event';

import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Tooltip } from '@nextui-org/react';

import cn from 'classnames';
import { IconSettings, IconBuildingFortress, IconPlugConnected, IconPlugOff } from '@tabler/icons';

import { useAppStore } from '../../store';

export function NavMenu() {
  const navigate = useNavigate();
  const lcuRunning = useAppStore(s => s.lcuRunning);

  return (
    <div className={s.nav}>
      <div className={s.header}></div>

      <Button.Group
        color="secondary"
        vertical
        animated
        flat
      >
        <Button
          onPress={() => navigate('/')}
        >
          <Tooltip content={'Builds'} placement={'right'}>
            <IconBuildingFortress/>
          </Tooltip>
        </Button>
        <Button
          onPress={() => navigate('/settings')}
        >
          <Tooltip content={'Settings'} placement={'right'}>
            <IconSettings/>
          </Tooltip>
        </Button>
      </Button.Group>

      <div className={cn(s.lol, lcuRunning && s.online)}>
        <Tooltip
          placement={'right'}
          content={lcuRunning ? `Connected to LoL client` : `Disconnected with LoL Client`}
        >
          {lcuRunning ? <IconPlugConnected color={'#0072F5'}/> : <IconPlugOff color={'#889096'}/>}
        </Tooltip>
      </div>
    </div>
  );
}
