import s from './style.module.scss';

import { invoke } from '@tauri-apps/api';

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button, Checkbox, Badge, Tooltip } from '@nextui-org/react';

import { appConf } from 'src/config';
import { isDev } from 'src/helper';
import { Source } from 'src/interfaces';
import { useAppStore } from 'src/store';
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
    const selected = selectedSources.join(',');
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
        <Checkbox.Group
          label="Select Source(s)"
          value={selectedSources}
          // @ts-ignore
          onChange={onSelectChange}
        >
          {sources.map((i) => {
            const isSR = !i.source.isAram && !i.source.isUrf;

            return (
              <Checkbox
                key={i.source.value}
                className={s.source}
                // @ts-ignore
                value={i.source.value}
              >
                {i.source.label}
                {isSR && <Badge variant="dot" className={s.mode}/>}
                {i.source.isAram && <Badge variant="dot" color="success" className={s.mode}/>}
                {i.source.isUrf && <Badge variant="dot" color="warning" className={s.mode}/>}
                <Badge className={s.version}>{i.source_version}</Badge>
              </Checkbox>
            );
          })}
        </Checkbox.Group>
      </div>

      <div className={s.modes}>
        {!ready && <div className={s.prepare}>
          <IconRotateClockwise2 className={s.spin}/>
          Preparing...
        </div>}

        <div className={s.map}>
          <Badge variant="dot"/> Summoner's Rift
        </div>
        <div className={s.map}>
          <Badge variant="dot" color="success"/> ARAM
        </div>
        <div className={s.map}>
          <Badge variant="dot" color="warning"/> URF
        </div>
      </div>

      <div className={s.btns}>
        {/*// @ts-ignore*/}
        <Tooltip content={lcuRunning ? `` : `Please start League of Legends first`} placement={'top'}>
          <Button color={'primary'} onPress={goToImportResult} disabled={!lcuRunning}>Apply Builds</Button>
        </Tooltip>
        {isDev &&
          (<Button flat auto size={'sm'} onPress={onToggleWindow}>Runes</Button>)
        }
      </div>
    </section>
  );
}

