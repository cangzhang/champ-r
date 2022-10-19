import { invoke } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';

import { useEffect, useRef, useState, useCallback } from 'react';
import SimpleBar from 'simplebar-react';
import { Button, Checkbox, Container } from '@nextui-org/react';

import { appConf } from '../../config';

import 'simplebar-react/dist/simplebar.min.css';
import s from './style.module.scss';

function Home() {
  const [result, setResult] = useState<any[]>([]);
  const [sources, setSources] = useState<any>([]);
  const [selectedSources, setSelectedSources] = useState<string[]>([]);

  let ids = useRef(new Set()).current;

  const onToggleWindow = () => {
    invoke(`toggle_rune_window`);
  };

  const applyBuilds = () => {
    invoke(`apply_builds`, { sources: ['op.gg-aram', 'op.gg', 'u.gg-aram', 'u.gg'] });
  };

  const updateResult = useCallback((payload: any) => {
    let id = payload.id;
    if (ids.has(payload.id)) {
      return;
    }
    ids.add(id);

    let msg = payload.msg;
    if (payload.done) {
      msg = `[${payload.source}] done`;
    }
    setResult(r => [msg, ...r]);
  }, []);

  const onSelectChange = useCallback((next: string[]) => {
    setSelectedSources(next);
    appConf.set("selectedSources", next);
  }, []);

  useEffect(() => {
    let unlisten = () => { };
    listen('main_window::apply_builds_result', h => {
      console.log(h.payload);
      updateResult(h.payload as Array<any>);
    }).then(h => {
      unlisten = h;
    });

    return () => {
      unlisten();
    };
  }, [updateResult]);

  useEffect(() => {
    invoke(`get_user_sources`)
      .then((l: any) => {
        setSources(l);
      });
  }, []);

  useEffect(() => {
    appConf.get<string[]>("selectedSources")
      .then((s) => {
        setSelectedSources(s ?? []);
      });

    return () => {
      appConf.save();
    }
  }, [])

  return (
    <Container>
      <h2>ChampR - rs</h2>

      <SimpleBar forceVisible={true} className={s.sourceList}>
        <Checkbox.Group
          label="Select sources"
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

      <Button color={"primary"} onClick={applyBuilds}>Apply Builds</Button>

      <div style={{ height: 200, overflow: `auto` }}>
        {result.map((i, idx) => <p key={idx}>{i}</p>)}
      </div>
    </Container>
  );
}

export default Home;
