import { invoke } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';

import { useEffect, useRef, useState, useCallback } from 'react';
import SimpleBar from 'simplebar-react';
import Checkbox from '@jetbrains/ring-ui/dist/checkbox/checkbox';
import Button from '@jetbrains/ring-ui/dist/button/button';

import { appConf } from '../../config';

import 'simplebar-react/dist/simplebar.min.css';
import s from './style.module.scss';

console.log(s);

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

  const toggleSelectSource = useCallback((s: string, prev: string[]) => (ev: any) => {
    let next = [...prev];
    next = next.includes(s)
      ? next.filter(i => i !== s)
      : [...next, s]

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
    document
      .getElementById('titlebar-minimize')
      .addEventListener('click', () => appWindow.minimize());
    document
      .getElementById('titlebar-maximize')
      .addEventListener('click', () => appWindow.toggleMaximize());
    document
      .getElementById('titlebar-close')
      .addEventListener('click', () => appWindow.close());
  }, []);

  useEffect(() => {
    invoke(`get_user_sources`)
      .then((l: any) => {
        setSources(l);
      });
  }, []);

  useEffect(() => {
    appConf.get<string[]>("selectedSources")
      .then((s) => {
        setSelectedSources(s);
      });

    return () => {
      appConf.save();
    }
  }, [])

  return (
    <section className="App">
      <h2>ChampR - rs</h2>

      <SimpleBar forceVisible={true}>
          <div className={s.sourceList}>
          {sources.map((i: any) => {
            let checked = selectedSources.includes(i.source.value);

            return (
              <Checkbox
                key={i.source.value}
                label={i.source.label}
                checked={checked}
                onChange={toggleSelectSource(i.source.value, selectedSources)}
              />
            );
          })}
        </div>
      </SimpleBar>

      <Button primary={true} onClick={applyBuilds}>Apply Builds</Button>

      <div style={{ height: 200, overflow: `auto` }}>
        {result.map((i, idx) => <p key={idx}>{i}</p>)}
      </div>
    </section>
  );
}

export default Home;
