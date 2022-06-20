import { useState } from 'react';
import { invoke } from '@tauri-apps/api';

import './App.css';

function App() {
  const [str, setStr] = useState(``);

  const onCall = () => {
    invoke(`greeting`, {name: 'al'}).then((ret) => {
      setStr(ret as string);
    });
  }

  const onToggleWindow = () => {
      invoke(`show_popup`);
  }

  return (
    <div className="App">
      <header className="App-header">
        <button onClick={onCall}>hello there</button>
        <button onClick={onToggleWindow}>show window</button>
      </header>
      <div>{str}</div>
    </div>
  );
}

export default App;
