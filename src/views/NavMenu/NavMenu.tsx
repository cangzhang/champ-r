import s from './style.module.scss';

import { useNavigate } from 'react-router-dom';
import {
  Button,
  ButtonGroup,
  Tooltip,
  TooltipTrigger,
} from '@adobe/react-spectrum';
import cn from 'classnames';
import { IconSettings, IconBuildingFortress, IconPlugConnected, IconPlugOff } from '@tabler/icons';

import { useAppStore } from '../../store';

export function NavMenu() {
  const navigate = useNavigate();
  const lcuRunning = useAppStore(s => s.lcuRunning);

  return (
    <div className={s.nav}>
      <div className={s.header}></div>

      <ButtonGroup
        orientation="vertical"
      >
        <TooltipTrigger placement={'right'}>
          <Button
            variant={'secondary'}
            onPress={() => navigate('/')}>
            <IconBuildingFortress/>
          </Button>
          <Tooltip>Builds</Tooltip>
        </TooltipTrigger>

        <TooltipTrigger placement={'right'}>
          <Button
            width={'size-100'}
            marginTop={'size-25'}
            variant={'secondary'}
            onPress={() => navigate('/settings')}>
            <IconSettings/>
          </Button>
          <Tooltip>Settings</Tooltip>
        </TooltipTrigger>
      </ButtonGroup>

      <div className={cn(s.lol, lcuRunning && s.online)}>
        <TooltipTrigger>
          {lcuRunning ? <IconPlugConnected color={'#0072F5'}/> : <IconPlugOff color={'#889096'}/>}
          <Tooltip
            placement={'right'}
          >
          </Tooltip>
        </TooltipTrigger>
      </div>
    </div>
  );
}
