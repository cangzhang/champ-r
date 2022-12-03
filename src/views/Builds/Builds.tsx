import s from './style.module.scss';

import { invoke } from '@tauri-apps/api';

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Button,
  Checkbox,
  Tooltip,
  CheckboxGroup,
  StatusLight,
  Flex,
  TooltipTrigger,
} from '@adobe/react-spectrum';

import { appConf } from '../../config';
import { isDev } from '../../helper';
import { Source } from '../../interfaces';
import { useAppStore } from '../../store';
import { IconRotateClockwise2 } from '@tabler/icons';

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
      <div className={s.sourceList}>
        <CheckboxGroup
          label="Select Source(s)"
          value={selectedSources}
            // @ts-ignore
          onChange={onSelectChange}
        >
          {sources.map((i) => {
            let isSR = !i.source.isAram && !i.source.isUrf;

            return (
              <Checkbox
                key={i.source.value}
                UNSAFE_className={s.source}
                  // @ts-ignore
                value={i.source.value}
              >
                <Flex>
                  {i.source.label}
                  {isSR && <StatusLight variant="seafoam" UNSAFE_className={s.mode}/>}
                  {i.source.isAram && <StatusLight variant="indigo" UNSAFE_className={s.mode}/>}
                  {i.source.isUrf && <StatusLight variant="purple" UNSAFE_className={s.mode}/>}
                  <StatusLight variant="info" UNSAFE_className={s.version}>{i.source_version}</StatusLight>
                </Flex>
              </Checkbox>
            );
          })}
        </CheckboxGroup>
      </div>

      <div className={s.modes}>
        {!ready && <div className={s.prepare}>
          <IconRotateClockwise2 className={s.spin}/>
          Preparing...
        </div>}

        <Flex>
          <div className={s.map}>
            <StatusLight variant="positive">Summoner's Rift</StatusLight>
          </div>
          <div className={s.map}>
            <StatusLight variant="positive">ARAM</StatusLight>
          </div>
          <div className={s.map}>
            <StatusLight variant="positive">URF</StatusLight>
          </div>
        </Flex>
      </div>

      <div className={s.btns}>
        <TooltipTrigger>
          <Button variant="accent">Apply Builds</Button>
          <Tooltip>{lcuRunning ? `` : `Please start League of Legends first`}</Tooltip>
        </TooltipTrigger>

        {isDev &&
          (<Button variant="primary" onPress={onToggleWindow}>Runes</Button>)
        }
      </div>
    </section>
  );
}

