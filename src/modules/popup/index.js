import { ipcRenderer } from 'electron';

import React, { useEffect } from 'react';

export default function Popup() {
  const send = () => {
    ipcRenderer.send(`broadcast`, {
      channel: `for-popup`,
      time: new Date(),
    });
  };

  useEffect(() => {
    ipcRenderer.on('for-popup', function (event, data) {
      console.log(`popup data: `, data);
    });
  }, []);

  return <div>
    popup

    <button onClick={send}>send</button>
  </div>;
}
