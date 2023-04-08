import { Button, Tooltip } from '@nextui-org/react';
import {
  IconBuildingFortress,
  IconPlugConnected,
  IconPlugOff,
  IconSettings,
} from '@tabler/icons';
import cn from 'clsx';
import { useNavigate } from 'react-router-dom';

import { useAppStore } from 'src/store';

import s from './style.module.scss';

export function NavMenu() {
  const navigate = useNavigate();
  const lcuRunning = useAppStore((s) => s.lcuRunning);

  return (
    <div className={s.nav}>
      <div className={s.header}></div>

      <Button.Group color="secondary" vertical animated flat>
        <Button onPress={() => navigate('/')}>
          {/*// @ts-ignore*/}
          <Tooltip content={'Builds'} placement={'right'}>
            <IconBuildingFortress />
          </Tooltip>
        </Button>
        <Button onPress={() => navigate('/settings')}>
          {/*// @ts-ignore*/}
          <Tooltip content={'Settings'} placement={'right'}>
            <IconSettings />
          </Tooltip>
        </Button>
      </Button.Group>

      <div className={cn(s.lol, lcuRunning && s.online)}>
        {/*// @ts-ignore*/}
        <Tooltip
          placement={'right'}
          content={
            lcuRunning ? `Detected LoL Client Running` : `LoL Client not Found`
          }
        >
          {lcuRunning ? (
            <IconPlugConnected color={'#0072F5'} />
          ) : (
            <IconPlugOff color={'#889096'} />
          )}
        </Tooltip>
      </div>
    </div>
  );
}
