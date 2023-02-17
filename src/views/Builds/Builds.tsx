import s from './style.module.scss';

import { invoke } from '@tauri-apps/api';

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';

import { appConf } from 'src/config';
import { isDev } from 'src/helper';
import { Source } from 'src/interfaces';
import { useAppStore } from 'src/store';
import { IconRotateClockwise2 } from '@tabler/icons';

import { Checkbox } from 'src/components/ui/Checkbox';
import { Button } from 'src/components/ui/Button';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from 'src/components/ui/Tooltip';

export function Builds() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [ready, setReady] = useState(false);

  const navigate = useNavigate();
  const lcuRunning = useAppStore(s => s.lcuRunning);

  const onToggleWindow = () => {
    invoke(`random_runes`);
  };

  const goToImportResult = () => {
    let selected = selectedSources.join(',');
    navigate(`/import?sources=${selected}`);
  };

  const onSelectChange = useCallback((next: string[]) => {
    setSelectedSources(next);
    appConf.set('selectedSources', next);
    appConf.save();
  }, []);

  useEffect(() => {
    invoke(`get_user_sources`)
      .then((l) => {
        // console.log('sources', l);
        setSources(l as Source[]);
        setReady(true);
      });
  }, []);

  useEffect(() => {
    appConf.get<string[]>('selectedSources')
      .then((s) => {
        setSelectedSources(s ?? []);
      });

    return () => {
      appConf.save();
    };
  }, []);

  return (
    <section className={s.builds}>
      <TooltipProvider>
        <div className={s.sourceList}>
          {
            sources.map((s) => {
              let sourceId = `source_${s.source.value}`;

              return (
                <div className="flex items-center gap-2" key={sourceId}>
                  <Checkbox id={sourceId}/>
                  <label
                    htmlFor={sourceId}
                    className="text-xl font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
                  >
                    {s.source.label}
                  </label>
                </div>
              );
            })
          }
        </div>

        <div className={s.modes}>
          {!ready && <div className={s.prepare}>
            <IconRotateClockwise2 className={s.spin}/>
            Preparing...
          </div>}
        </div>

        <div className={s.btns}>
          <Tooltip>
            <TooltipTrigger>
              <>Apply Builds</>
            </TooltipTrigger>
            <TooltipContent>
              <div>
                {lcuRunning ? `` : `Please start League of Legends first`}
              </div>
            </TooltipContent>
          </Tooltip>

          {isDev &&
            (<Button onClick={onToggleWindow}>Runes</Button>)
          }
        </div>
      </TooltipProvider>
    </section>
  );
}

