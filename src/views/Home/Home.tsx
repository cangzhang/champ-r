import { useEffect, useRef, useState, useCallback } from 'react';
import { invoke } from '@tauri-apps/api';
import { listen } from '@tauri-apps/api/event'

import './style.css';

function Home() {
  const [result, setResult] = useState<any[]>([]);

  let unlistener = useRef(() => { });
  let ids = useRef(new Set()).current;

  const onToggleWindow = () => {
    invoke(`toggle_rune_window`);
  }

  const applyBuilds = () => {
    invoke(`apply_builds`, { sources: ["op.gg-aram", "op.gg", "u.gg-aram", "u.gg"] });
  }

  const updateResult = useCallback((payload: any) => {
    let id = payload.id;
    if (ids.has(payload.id)) {
      return;
    }
    ids.add(id);

    let msg = payload.msg;
    if (payload.done) {
      msg = `[${payload.source}] done`
    }
    setResult(r => [msg, ...r])
  }, []);

  useEffect(() => {
    async function startRadio() {
      if (unlistener.current) {
        await unlistener.current();
      }

      unlistener.current = await listen("main_window::apply_builds_result", ev => {
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
        <h1 className={"text-3xl font-bold underline"}>HOME</h1>
        <ul>
          <li>
            <button onClick={onToggleWindow}>Toggle Window</button>
          </li>
          <li>
            <button onClick={applyBuilds}>Apply Builds</button>
          </li>
        </ul>
      </div>

      <div style={{ height: 200, overflow: `auto` }}>
        {result.map((i, idx) => <p key={idx}>{i}</p>)}
      </div>
    </section>
  );
}

export default Home;
