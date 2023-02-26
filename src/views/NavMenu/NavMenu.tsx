import {
  IconBuildingFortress,
  IconPlugConnected,
  IconPlugOff,
  IconSettings,
} from '@tabler/icons';
import { clsx } from 'clsx';
import { useNavigate } from 'react-router-dom';

import { Button } from 'src/components/ui/Button';
import { Separator } from 'src/components/ui/Separator';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'src/components/ui/Tooltip';

import { useAppStore } from 'src/store';

import s from './style.module.scss';

export function NavMenu() {
  const navigate = useNavigate();
  const lcuRunning = useAppStore((s) => s.lcuRunning);

  return (
    <div
      className={clsx(
        'flex flex-col items-center border-r border-r-slate-200 pb-12 w-16'
      )}
    >
      <div className={clsx('flex flex-col gap-2 items-center mt-4')}>
        <Button
          size={'sm'}
          variant={'link'}
          className={clsx('flex align-start')}
          onClick={() => navigate('/')}
        >
          <IconBuildingFortress />
        </Button>
        <Separator />
        <Button
          size={'sm'}
          variant={'link'}
          className={clsx('flex align-start')}
          onClick={() => navigate('/settings')}
        >
          <IconSettings />
        </Button>
      </div>

      <div className={clsx(s.lol, lcuRunning && s.online, 'mt-auto')}>
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger>
              {lcuRunning ? (
                <IconPlugConnected color={'#0072F5'} />
              ) : (
                <IconPlugOff color={'#889096'} />
              )}
            </TooltipTrigger>
            <TooltipContent>
              <p>{lcuRunning ? 'Connected' : 'Disconnected'}</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </div>
    </div>
  );
}
