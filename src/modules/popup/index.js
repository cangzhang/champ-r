/* eslint react-hooks/exhaustive-deps: 0 */
import s from './style.module.scss';

import { ipcRenderer } from 'electron';
import React, { useCallback, useEffect, useState, useRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';

import config from 'src/native/config';
import { getChampions, DDragonCDNUrl } from 'src/service/ddragon';
import LolQQ from 'src/service/data-source/lol-qq';
import LCUService from 'src/service/lcu';
import PerkShowcase from 'src/components/perk-showcase';

import { getChampionInfo } from './utils';

export default function Popup() {
  const lolVer = config.get(`lolVer`);
  const lolDir = config.get(`lolDir`);
  const lcu = useRef({});

  const [championMap, setChampionMap] = useState(null);
  const [championId, setChampionId] = useState('');
  const [position, setPosition] = useState('');
  const [perks, setPerkList] = useState([]);
  const [championDetail, setChampionDetail] = useState(null);

  useEffect(() => {
    getChampions(lolVer)
      .then(championList => {
        setChampionMap(championList);

        ipcRenderer.on('for-popup', (event, { championId: id, position: pos }) => {
          if (id) {
            setChampionId(id);
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
    if (!champ) {
      setChampionId(0);
      setChampionDetail(null);
      return;
    }

    setChampionDetail(champ);
    const lolqqInstance = new LolQQ();
    lolqqInstance.getChampionPerks(champ.key, champ.id)
      .then(perks => {
        setPerkList(perks);
        // console.log(perks)
      });
  }, [championId, championMap]);

  const apply = async perk => {
    lcu.current = new LCUService(lolDir);
    await lcu.current.getAuthToken();
    const res = await lcu.current.applyPerk({
      ...perk,
      name: `${perk.alias} @ ${perk.position}`,
    });
    console.info(`updated perk`, res);
  };

  const renderList = useCallback(() => {
    if (!championMap || !perks.length) {
      return <div className={s.loading}>loading...</div>;
    }

    return (
      <Scrollbars
        style={{
          height: `calc(100vh - 100px)`,
        }}
      >
        {
          perks
            .map((p, idx) =>
              <PerkShowcase
                key={`${championId}-${idx}`}
                perk={p}
                onApply={() => apply(p)}
              />,
            )
        }
      </Scrollbars>
    );
  }, [championMap, perks, championId]);

  return <div className={s.list}>
    {
      championDetail &&
      <img className={s.avatar} src={`${DDragonCDNUrl}/${lolVer}/img/champion/${championDetail.id}.png`} alt="" />
    }
    {renderList()}
  </div>;
}
