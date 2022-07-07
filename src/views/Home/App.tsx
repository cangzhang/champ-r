import { useEffect, useRef, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api';
import { appWindow } from '@tauri-apps/api/window'

import './App.css';

function App() {
  const [str, setStr] = useState(``);
  const [result, setResult] = useState<any[]>([]);
  
  let unlistener = useRef(() => {});
  let ids = useRef(new Set());

  const onCall = () => {
    invoke(`greeting`, { name: 'al' }).then((ret) => {
      setStr(ret as string);
    });
  }

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

  useEffect(() => {
    async function startRadio() {
      if (unlistener.current) {
        await unlistener.current();
      }

      unlistener.current = await appWindow.listen("apply_build_result", ev => {
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
        <button onClick={onCall}>Say Hello</button>
        <button onClick={onToggleWindow}>Toggle Window</button>
        <button onClick={applyBuilds}>Apply Builds</button>
      </div>
      <div>{str}</div>
      <div style={{ height: 200, overflow: `auto`, width: 700 }}>
        {result.map((i, idx) => <p key={idx}>{i.join(`, `)}</p>)}
      </div>
    </section>
  );
}

export default App;
