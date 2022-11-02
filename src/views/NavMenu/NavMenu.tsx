import s from './style.module.scss';

import { useNavigate } from 'react-router-dom';
import { Button, Tooltip } from '@nextui-org/react';

import { IconAffiliate, IconSettings, IconBuildingFortress } from '@tabler/icons';

export function NavMenu() {
  const navigate = useNavigate();
  
  return (
    <div className={s.nav}>
      <div className={s.header}>
      </div>
      
      <Button.Group
        color="secondary"
        vertical
        animated
        flat
      >
        <Button
          onClick={() => navigate('/')}
        >
          <Tooltip content={'Builds'} placement={'right'}>
            <IconBuildingFortress/>
          </Tooltip>
        </Button>
        <Button
          onClick={() => navigate('/settings')}
        >
          <Tooltip content={'Settings'} placement={'right'}>
            <IconSettings/>
          </Tooltip>
        </Button>
      </Button.Group>
    </div>
  );
}
