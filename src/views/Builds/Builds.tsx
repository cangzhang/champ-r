import { invoke } from '@tauri-apps/api';

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import SimpleBar from 'simplebar-react';
import { Button, Checkbox, Container } from '@nextui-org/react';

import { appConf } from '../../config';

import 'simplebar-react/dist/simplebar.min.css';
import s from './style.module.scss';

export function Builds() {
  const [sources, setSources] = useState<any>([]);
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
    .then((l: any) => {
      setSources(l);
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
    <Container>
      <SimpleBar forceVisible={true} className={s.sourceList}>
        <Checkbox.Group
          label="Select Source(s)"
          value={selectedSources}
          onChange={onSelectChange}
        >
          {sources.map((i: any) => {
            return (
              <Checkbox
                key={i.source.value}
                label={i.source.label}
                value={i.source.value}
              />
            );
          })}
        </Checkbox.Group>
      </SimpleBar>

      <Button color={'primary'} onClick={goToImportResult}>Apply Builds</Button>
      <Button flat size={'sm'} onClick={onToggleWindow}>Toggle Runes</Button>
    </Container>
  );
}

