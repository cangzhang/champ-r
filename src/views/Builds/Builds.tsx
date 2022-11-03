import s from './style.module.scss';

import { invoke } from '@tauri-apps/api';

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import { Button, Checkbox, Container, Badge } from '@nextui-org/react';

import { appConf } from '../../config';
import { isDev } from '../../helper';
import { Source } from '../../interfaces';

export function Builds() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  const navigate = useNavigate();

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
  }, []);

  useEffect(() => {
    invoke(`get_user_sources`)
      .then((l) => {
        console.log('sources', l);
        setSources(l as Source[]);
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
    <section>
      <SimpleBar forceVisible={true} className={s.sourceList}>
        <Checkbox.Group
          label="Select Source(s)"
          value={selectedSources}
          onChange={onSelectChange}
        >
          {sources.map((i) => {
            let isSR = !i.source.isAram && !i.source.isUrf;

            return (
              <Checkbox
                key={i.source.value}
                className={s.source}
                value={i.source.value}
              >
                {i.source.label}
                <Badge className={s.version}>{i.source_version}</Badge>
                {isSR && <Badge variant="dot" className={s.mode} />}
                {i.source.isAram && <Badge variant="dot" color="success" className={s.mode} />}
                {i.source.isUrf && <Badge variant="dot" color="warning" className={s.mode} />}
              </Checkbox>
            );
          })}
        </Checkbox.Group>
      </SimpleBar>

      <div className={s.modes}>
        <div>
          <Badge variant="dot" /> Summoner's Rift
        </div>
        <div>
          <Badge variant="dot" color="success" /> ARAM
        </div>
        <div>
          <Badge variant="dot" color="warning" /> URF
        </div>
      </div>

      <div className={s.btns}>
        <Button color={'primary'} onClick={goToImportResult}>Apply Builds</Button>
        {isDev &&
          (<Button flat size={'sm'} onClick={onToggleWindow}>Toggle Runes</Button>)
        }
      </div>
    </section>
  );
}

