import { Badge, Button, Checkbox, Tooltip } from '@nextui-org/react';
import { Modal } from '@nextui-org/react';
import { IconRotateClockwise2 } from '@tabler/icons';
import { invoke } from '@tauri-apps/api';
import { Event, listen } from '@tauri-apps/api/event';
import { useCallback, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

import { appConf } from 'src/config';
import { isDev } from 'src/helper';
import { Source } from 'src/interfaces';
import { useAppStore } from 'src/store';

import s from './style.module.scss';

export function Builds() {
  const [sources, setSources] = useState<Source[]>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);
  const [ready, setReady] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const navigate = useNavigate();
  const lcuRunning = useAppStore((s) => s.lcuRunning);

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

  const onCheckLcuReady = useCallback(() => {
    invoke(`test_connectivity`);
    invoke(`check_and_fix_tencent_server`);
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

  useEffect(() => {
    invoke(`check_and_fix_tencent_server`);

    listen(
      'main::applied_fix_to_tencent_server',
      (r: Event<{ applied: boolean; ready: boolean }>) => {
        console.log('applied_fix_to_tencent_server', r);
        const { payload } = r;
        if (payload.applied) {
          setShowModal(true);
        }
      }
    );
  }, []);

  useEffect(() => {
    listen('main::test_connectivity', (r) => {
      const { payload } = r;
      if (payload) {
        setShowModal(false);
      }
    });
  }, []);

  return (
    <section className={s.builds}>
      <div className={s.sourceList}>
        <Checkbox.Group
          label="Select Source(s)"
          value={selectedSources}
          onChange={onSelectChange}
        >
          {sources.map((i) => {
            const isSR = !i.source.isAram && !i.source.isUrf;

            return (
              <Checkbox
                key={i.source.value}
                className={s.source}
                value={i.source.value}
              >
                {i.source.label}
                {isSR && <Badge variant="dot" className={s.mode} />}
                {i.source.isAram && (
                  <Badge variant="dot" color="success" className={s.mode} />
                )}
                {i.source.isUrf && (
                  <Badge variant="dot" color="warning" className={s.mode} />
                )}
                <Badge className={s.version}>{i.source_version}</Badge>
              </Checkbox>
            );
          })}
        </Checkbox.Group>
      </div>

      <div className={s.modes}>
        {!ready && (
          <div className={s.prepare}>
            <IconRotateClockwise2 className={s.spin} />
          </div>
        )}

        <div className={s.map}>
          <Badge variant="dot" /> {`Summoner's Rift`}
        </div>
        <div className={s.map}>
          <Badge variant="dot" color="success" /> ARAM
        </div>
        <div className={s.map}>
          <Badge variant="dot" color="warning" /> URF
        </div>
      </div>

      <div className={s.btns}>
        <Tooltip
          content={lcuRunning ? `` : `Please start League of Legends first`}
          placement={'top'}
        >
          <Button
            color={'primary'}
            onPress={goToImportResult}
            disabled={!lcuRunning}
          >
            Apply Builds
          </Button>
        </Tooltip>
        {isDev && (
          <Button flat auto size={'sm'} onPress={onToggleWindow}>
            Runes
          </Button>
        )}
      </div>
      <Modal
        open={showModal}
        preventClose={true}
        onClose={() => setShowModal(false)}
      >
        <Modal.Body>
          <div>Please restart League of Legends to make ChampR work.</div>
        </Modal.Body>
        <Modal.Footer>
          <Button onPress={onCheckLcuReady}>Re-Check</Button>
        </Modal.Footer>
      </Modal>
    </section>
  );
}
