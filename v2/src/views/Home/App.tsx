import { useState } from 'react';
import { invoke } from '@tauri-apps/api';
import { emit, listen } from '@tauri-apps/api/event'

import './App.css';

function App() {
  const [str, setStr] = useState(``);

  const onCall = () => {
    invoke(`greeting`, { name: 'al' }).then((ret) => {
      setStr(ret as string);
    });
  }

  const onToggleWindow = () => {
    // emit("event-name", { message: 'emit' })
    invoke(`emit_msg`);
  }

  return (
    <section className="App">
      <div className="App-header">
        <h1>HOME</h1>
        <button onClick={onCall}>say hello</button>
        <button onClick={onToggleWindow}>show window</button>
      </div>
      <div>{str}</div>
    </section>
  );
}

export default App;