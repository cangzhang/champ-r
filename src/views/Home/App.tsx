import { useState } from 'react';
import { invoke } from '@tauri-apps/api';

import './App.css';

function App() {
  const [str, setStr] = useState(``);

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

  return (
    <section className="App">
      <div className="App-header">
        <h1>HOME</h1>
        <button onClick={onCall}>Say Hello</button>
        <button onClick={onToggleWindow}>Toggle Window</button>
        <button onClick={applyBuilds}>Apply Builds</button>
      </div>
      <div>{str}</div>
    </section>
  );
}

export default App;
