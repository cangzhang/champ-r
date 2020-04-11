import { ipcRenderer } from 'electron';

import React, { useEffect, useState } from 'react';

import config from 'src/native/config';
import { getChampions } from 'src/service/ddragon';

export default function Popup() {
  const lolVer = config.get(`lolVer`);

  const [championMap, setChampionMap] = useState(null);
  const [champion, setChampion] = useState('');
  const [position, setPosition] = useState('');

  useEffect(() => {
    ipcRenderer.on('for-popup', function (event, data) {
      console.log(`popup data: `, data);
      setChampion(data.champion);
      setPosition(data.position);
    });
  }, []);

  useEffect(() => {
    getChampions(lolVer)
      .then(champions => {
        setChampionMap(champions);
        console.log(champions);
      });
  }, [lolVer]);

  return <div>
    {
      championMap && champion
        ? <p>
          Champion: {champion}, Position: {position}.
        </p>
        : <p>No selected.</p>
    }
  </div>;
}
