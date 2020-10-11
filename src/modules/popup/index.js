/* eslint react-hooks/exhaustive-deps: 0 */
import s from './style.module.scss';

import 'src/modules/i18n';

import { ipcRenderer } from 'electron';
import React, { useEffect, useState, useRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { useTranslation } from 'react-i18next';
import { useImmer } from 'use-immer';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';
import { ButtonGroup, SIZE } from 'baseui/button-group';
import { Button } from 'baseui/button';

import config from 'src/native/config';
import { QQChampionAvatarPrefix, getChampions } from 'src/service/qq';
import LCUService from 'src/service/lcu';
import LolQQ from 'src/service/data-source/lol-qq';
import Opgg from 'src/service/data-source/op-gg';
import Sources from 'src/share/constants/sources';

import MurderBridge from 'src/service/data-source/murderbridge';
import PerkShowcase from 'src/components/perk-showcase';
import RunePreview from 'src/components/rune-preview';
import Loading from 'src/components/loading-spinner';

import { getChampionInfo } from './utils';

const engine = new Styletron();
const SourceList = [
  {
    name: `QQ`,
    value: Sources.Lolqq,
  },
  {
    name: `OP.GG`,
    value: Sources.Opgg,
  },
  {
    name: `MB`,
    value: Sources.MurderBridge,
    aram: true,
  },
];

export default function Popup() {
  const lolVer = config.get(`lolVer`);
  const lolDir = config.get(`lolDir`);
  const [t] = useTranslation();
  const lcu = useRef({});

  const [activeTab, setActiveTab] = useState(config.get(`perkTab`) || Sources.Lolqq);
  const [perkList, setPerkList] = useImmer([[], [], []]);
  const [championMap, setChampionMap] = useState(null);
  const [championId, setChampionId] = useState('');
  const [championDetail, setChampionDetail] = useState(null);
  const [curPerk, setCurPerk] = useState({});
  const [coordinate, setCoordinate] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useEffect(() => {
    getChampions(lolVer).then((championList) => {
      setChampionMap(championList);

      ipcRenderer.on('for-popup', (event, { championId: id }) => {
        if (id) {
          setChampionId(id);
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!championId || !championMap) return;

    const champ = getChampionInfo(championId, championMap);
    if (!champ) {
      setChampionId(0);
      setChampionDetail(null);
      return;
    }

    setChampionDetail(champ);

    const lolqqInstance = new LolQQ();
    lolqqInstance.getChampionPerks(champ.key, champ.id).then((result) => {
      setPerkList((draft) => {
        draft[0] = result;
      });
    });

    const opggInstance = new Opgg();
    opggInstance.getRunesFromCDN(champ.alias).then((result) => {
      setPerkList((draft) => {
        draft[1] = result;
      });
    });

    const mbInstance = new MurderBridge();
    mbInstance.getRunesFromCDN(champ.alias).then((result) => {
      setPerkList((draft) => {
        draft[2] = result;
      });
    });
  }, [championId, championMap]);

  useEffect(() => {
    config.set(`perkTab`, activeTab);
  }, [activeTab]);

  const apply = async (perk) => {
    try {
      lcu.current = new LCUService(lolDir);
      await lcu.current.getAuthToken();

      if (!lcu.current.active) {
        throw new Error(`LCU not active.`);
      }

      const res = await lcu.current.applyPerk({
        ...perk,
      });
      console.info(`Applied perk`, res);

      new Notification(t(`applied`));
    } catch (e) {
      console.error(e.message);
    }
  };

  const showPreview = (perk, el) => {
    setCurPerk(perk);
    if (!el) return;

    const { x, y, width, height } = el.getBoundingClientRect();
    setCoordinate({ x, y, width, height });
  };

  const hidePreview = () => {
    setCurPerk({});
  };

  const onSelectSource = (_, idx) => {
    setActiveTab(SourceList[idx].value);
  };

  const renderList = (list = [], isAramMode = false) => {
    const shouldShowList = list.length && championDetail && list[0].alias === championDetail.id;

    if (!shouldShowList) {
      return <Loading className={s.listLoading} />;
    }

    return (
      <Scrollbars
        style={{
          height: `calc(100vh - 6rem)`,
        }}>
        {list.map((p, idx) => (
          <PerkShowcase
            key={`${championId}-${idx}`}
            idx={idx}
            isAramMode={isAramMode}
            perk={p}
            onApply={() => apply(p)}
            onMouseEnter={showPreview}
            onMouseLeave={hidePreview}
          />
        ))}

        <RunePreview perk={curPerk} coordinate={coordinate} />
      </Scrollbars>
    );
  };

  const renderContent = () => {
    if (!championMap || !perkList[0].length) {
      return <Loading className={s.loading} />;
    }

    const tabIdx = SourceList.findIndex((i) => i.value === activeTab);
    return (
      <div className={s.main}>
        {championDetail && (
          <div className={s.drag}>
            <img
              key={championDetail.id}
              className={s.avatar}
              alt={championDetail.name}
              src={`${QQChampionAvatarPrefix}/${championDetail.id}.png`}
            />

            <ButtonGroup size={SIZE.compact} onClick={onSelectSource} selected={[tabIdx]}>
              {SourceList.map((item) => (
                <Button key={item.value}>{item.name}</Button>
              ))}
            </ButtonGroup>
          </div>
        )}

        {perkList[tabIdx] && (
          <div className={s.list}>{renderList(perkList[tabIdx], SourceList[tabIdx].aram)}</div>
        )}
      </div>
    );
  };

  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={LightTheme}>{renderContent()}</BaseProvider>
    </StyletronProvider>
  );
}
