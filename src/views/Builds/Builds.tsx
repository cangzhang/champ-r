import { IconRotateClockwise2 } from '@tabler/icons';
import { invoke } from '@tauri-apps/api';
import { clsx } from 'clsx';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { Button } from 'src/components/ui/Button';
import { Checkbox } from 'src/components/ui/Checkbox';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'src/components/ui/Tooltip';

import { appConf } from 'src/config';
import { ModeGroup, getColorForMode, isDev } from 'src/helper';
import { Source } from 'src/interfaces';
import { useAppStore } from 'src/store';

import s from './style.module.scss';

export function Builds() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const navigate = useNavigate();
  const lcuRunning = useAppStore((s) => s.lcuRunning);

  const onToggleWindow = () => {
    invoke(`random_runes`);
  };

  const startImport = useCallback(() => {
    if (!lcuRunning) {
      return;
    }

    const selected = selectedSources.join(',');
    navigate(`/import?sources=${selected}`);
  }, [lcuRunning, navigate, selectedSources]);

  const onCheck = useCallback((val: string) => {
    let next: string[] = [];
    setSelectedSources((d) => {
      if (d.includes(val)) {
        next = d.filter((v) => v !== val);
      } else {
        next = [...d, val];
      }

      return next;
    });

    appConf.set('selectedSources', next);
    appConf.save();
  }, []);

  useEffect(() => {
    invoke(`get_user_sources`).then((l) => {
      setSources(l as Source[]);
      setReady(true);
    });
  }, []);

  useEffect(() => {
    appConf.get<string[]>('selectedSources').then((s) => {
      setSelectedSources(s ?? []);
    });

    return () => {
      appConf.save();
    };
  }, []);

  return (
    <section className={clsx(s.builds, 'flex flex-col')}>
      <TooltipProvider>
        <div className={clsx(s.sourceList, 'ml-4')}>
          {sources.map(({ source }) => {
            const sourceId = `source_${source.value}`;
            const checked = selectedSources.includes(source.value);
            const color = getColorForMode(source.isAram, source.isUrf);

            return (
              <div className="flex items-center gap-2 my-4" key={sourceId}>
                <Checkbox
                  className={s.checkbox}
                  id={sourceId}
                  checked={checked}
                  onCheckedChange={() => onCheck(source.value)}
                />
                <label
                  htmlFor={sourceId}
                  className="text-xl font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70 flex items-center gap-1.5">
                  {source.label}
                  <div
                    className={clsx(
                      'flex self-start rounded-full w-2 h-2',
                      `bg-${color}`
                    )}
                  />
                </label>
              </div>
            );
          })}
        </div>

        <div className={clsx(s.modes)}>
          {ModeGroup.map((mode) => {
            return (
              <div
                key={mode.value}
                className={clsx('pr-3 flex items-center italic')}>
                <div
                  className={clsx(
                    `bg-${mode.color}`,
                    'w-3 h-3 rounded-full mr-1'
                  )}
                />
                {mode.name}
              </div>
            );
          })}
        </div>

        <div className={clsx('flex items-center gap-2 px-4')}>
          <Tooltip>
            <TooltipTrigger asChild={true}>
              <Button variant={'subtle'} onClick={startImport}>
                Apply Builds
              </Button>
            </TooltipTrigger>
            {!lcuRunning && (
              <TooltipContent>
                <div>Please start League of Legends first</div>
              </TooltipContent>
            )}
          </Tooltip>

          {isDev && <Button onClick={onToggleWindow}>Runes</Button>}
        </div>
      </TooltipProvider>
    </section>
  );
}
