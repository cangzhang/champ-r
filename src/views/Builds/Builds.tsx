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
import { isDev } from 'src/helper';
import { Source } from 'src/interfaces';
import { useAppStore } from 'src/store';

import s from './style.module.scss';

const ModeGroup = [
  {
    name: 'SR',
    value: 'sr',
    color: 'cyan',
  },
  {
    name: 'ARAM',
    value: 'aram',
    color: 'indigo',
  },
  {
    name: 'URF',
    value: 'urf',
    color: 'amber',
  },
];

export function Builds() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const navigate = useNavigate();
  const lcuRunning = useAppStore((s) => s.lcuRunning);

  const onToggleWindow = () => {
    invoke(`random_runes`);
  };

  const startImport = () => {
    const selected = selectedSources.join(',');
    navigate(`/import?sources=${selected}`);
  };

  const onCheck = useCallback((val: string) => {
    let next: string[] = [];
    setSelectedSources(d => {
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
          {sources.map((source) => {
            const sourceId = `source_${source.source.value}`;
            const checked = selectedSources.includes(source.source.value);

            return (
              <div
                className="flex items-center gap-2 my-4 uppercase"
                key={sourceId}
              >
                <Checkbox className={s.checkbox} id={sourceId} checked={checked}
                          onCheckedChange={() => onCheck(source.source.value)}/>
                <label
                  htmlFor={sourceId}
                  className="text-xl font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                >
                  {source.source.label}
                </label>
              </div>
            );
          })}
        </div>

        <div className={s.modes}>
          {ModeGroup.map((mode) => {
            return (
              <div key={mode.value} className={clsx('pr-3 flex items-center italic')}>
                <div className={clsx(`bg-${mode.color}-500`, 'w-4 h-4 rounded-full')}/>
                {mode.name}
              </div>
            );
          })}
        </div>

        <div className={s.btns}>
          <Tooltip>
            <TooltipTrigger asChild={true}>
              <Button onClick={startImport}>Apply Builds</Button>
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
