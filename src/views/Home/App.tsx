import { useEffect, useRef, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event'

import './App.css';

function App() {
  const [result, setResult] = useState<any[]>([]);
  const [auth, setAuth] = useState(``);

  let unlistener = useRef(() => { });
  let ids = useRef(new Set());

  const onToggleWindow = () => {
    invoke(`toggle_rune_window`);
  }

  const applyBuilds = () => {
    invoke(`apply_builds_from_sources`, { sources: ["op.gg-aram"], dir: "../.cdn_files", keepOld: false });
  }

  const updateResult = useCallback((payload: any[]) => {
    const id = payload[payload.length - 1];
    if (ids.current.has(id)) {
      return;
    }

    ids.current.add(id);
    setResult(r => [...r, payload])
  }, []);

  const getLcuAuth = () => {
    invoke(`get_lcu_auth`).then((authUrl) => {
      console.log(`authUrl: ${authUrl}`);
      setAuth(authUrl as string);
    });
  }

  useEffect(() => {
    async function startRadio() {
      if (unlistener.current) {
        await unlistener.current();
      }

      unlistener.current = await listen("apply_build_result", ev => {
        console.log(ev.payload);
        updateResult(ev.payload as Array<any>);
      });
    }

    startRadio();

    return () => {
      async function stop() {
        await unlistener.current();
      }

      stop();
    }
  }, [updateResult])

  return (
    <section className="App">
      <div className="App-header">
        <h1>HOME</h1>
        <button onClick={onToggleWindow}>Toggle Window</button>
        <button onClick={applyBuilds}>Apply Builds</button>
        <button onClick={getLcuAuth}>LCU Auth</button>
      </div>

      <div style={{ height: 200, overflow: `auto`, width: 700 }}>
        {result.map((i, idx) => <p key={idx}>{i.join(`, `)}</p>)}
      </div>
      <div>LCU Auth: <code>{auth}</code></div>
    </section>
  );
}

export default App;
