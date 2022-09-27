import { invoke } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event';
import { appWindow } from '@tauri-apps/api/window';

import { useEffect, useRef, useState, useCallback } from 'react';
import SimpleBar from 'simplebar-react';

import { appConf } from '../../config';

import 'simplebar-react/dist/simplebar.min.css';
import './style.css';

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
    invoke(`get_user_sources`).then((l: any) => {
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
      <div className="App-header h-30 grid place-items-center pt-4">
        <div className="indicator w-36">
          <span className="indicator-item badge badge-primary indicator-middle indicator-end">rs</span>
          <div className="place-items-center text-3xl font-bold">ChampR</div>
        </div>
      </div>

      <SimpleBar className={'my-2 px-2 flex flex-col h-64'} forceVisible={true}>
        <div className="form-control">
          {sources.map((i: any) => {
            let checked = selectedSources.includes(i.source.value);

            return (
              <label className="label cursor-pointer" key={i.source.value}>
                <span className="label-text">{i.source.label}</span>
                <input
                  type="checkbox"
                  className="checkbox"
                  checked={checked}
                  onChange={toggleSelectSource(i.source.value, selectedSources)}
                />
              </label>
            );
          })}
        </div>
      </SimpleBar>

      <button className={'btn btn-sm'} onClick={applyBuilds}>Apply Builds</button>
      <div style={{ height: 200, overflow: `auto` }}>
        {result.map((i, idx) => <p key={idx}>{i}</p>)}
      </div>

      <div className="btm-nav">
        <button className="active">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
          </svg>
        </button>
        <button>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </button>
        <button>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24"
            stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2"
              d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
          </svg>
        </button>
      </div>
    </section>
  );
}

export default Home;
