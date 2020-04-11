import { ipcRenderer } from 'electron';

import React, { useEffect, useState } from 'react';

import config from 'src/native/config';
import { getChampions } from 'src/service/ddragon';

export default function Popup() {
  const lolVer = config.get(`lolVer`);

  const [championMap, setChampionMap] = useState(null);
  const [championId, setChampion] = useState('');
  const [position, setPosition] = useState('');

  useEffect(() => {
    ipcRenderer.on('for-popup', function (event, data) {
      console.log(`popup data: `, data);
      setChampion(data.championId);
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
      championMap && championId
        ? <p>
          championId: {championId}, Position: {position}.
        </p>
        : <p>No selected.</p>
    }
  </div>;
}
