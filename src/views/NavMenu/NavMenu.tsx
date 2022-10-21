import s from './style.module.scss';

import { NavLink, useNavigate } from 'react-router-dom';
import { Avatar, Badge, Button, Grid } from '@nextui-org/react';

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
        <Button onClick={() => navigate('/')}>
          Builds
        </Button>
        <Button onClick={() => navigate('/settings')}>
          Settings
        </Button>
      </Button.Group>
    </div>
  );
}
