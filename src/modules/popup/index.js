/* eslint react-hooks/exhaustive-deps: 0 */
import { ipcRenderer } from 'electron';
import React, { useCallback, useEffect, useState, useRef } from 'react';

import config from 'src/native/config';
import { getChampions } from 'src/service/ddragon';
import LolQQ from 'src/service/data-source/lol-qq';
import LCUService from 'src/service/lcu';
import { getChampionInfo } from './utils';

export default function Popup() {
  const lolVer = config.get(`lolVer`);
  const lolDir = config.get(`lolDir`);
  const lcu = useRef({});

  const [championMap, setChampionMap] = useState(null);
  const [championId, setChampion] = useState('');
  const [position, setPosition] = useState('');
  const [perks, setPerkList] = useState([]);

  useEffect(() => {
    lcu.current = new LCUService(lolDir);
    lcu.current.getAuthToken();
  }, [lolDir]);

  useEffect(() => {
    getChampions(lolVer)
      .then(championList => {
        setChampionMap(championList);

        ipcRenderer.on('for-popup', (event, { championId: id, position: pos }) => {
          if (id) {
            setChampion(id);
          }

          if (pos !== position) {
            setPosition(pos);
          }
        });
      });
  }, []);

  useEffect(() => {
    if (!championId || !championMap)
      return;

    const champ = getChampionInfo(championId, championMap);
    if (!champ)
      return;

    console.log(champ);
    const lolqqInstance = new LolQQ();
    lolqqInstance.getChampionPerks(champ.key, champ.id)
      .then(perks => {
        setPerkList(perks);
        console.log(perks);
      });
  }, [championId, championMap]);

  const apply = async perk => {
    if (!lcu.current.applyPerk)
      return;

    const res = await lcu.current.applyPerk(perk);
    console.log(`updated perk`, res);
  };

  const renderList = useCallback(() => {
    if (!championMap || !perks.length) {
      return <div>loading</div>;
    }

    return perks
      .map(i =>
        i.map((p, idx) =>
          <div key={`${championId}-${idx}`}>
            <p>{p.name}</p>
            <p>{p.primaryStyleId}, {p.subStyleId}</p>
            <p>{p.selectedPerkIds.join(`, `)}</p>
            <button onClick={() => apply(p)}>apply</button>
          </div>));
  }, [championMap, perks, championId]);

  return <div>
    {renderList()}
  </div>;
}
