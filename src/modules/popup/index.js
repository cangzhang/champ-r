/* eslint react-hooks/exhaustive-deps: 0 */
import s from './style.module.scss';

import 'src/modules/i18n';

import { ipcRenderer } from 'electron';
import React, { useEffect, useState, useRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { useTranslation } from 'react-i18next';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';
import { Tabs, Tab } from 'baseui/tabs';

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

import useGA from 'src/components/use-ga';
import { getChampionInfo } from './utils';

const engine = new Styletron();

export default function Popup() {
  const lolVer = config.get(`lolVer`);
  const lolDir = config.get(`lolDir`);
  const [t] = useTranslation();
  const lcu = useRef({});

  const [qqPerks, setQQPerkList] = useState([]);
  const [opggPerks, setOPggPerkList] = useState([]);
  const [mbPerks, setMBPerks] = useState([]);

  const [championMap, setChampionMap] = useState(null);
  const [championId, setChampionId] = useState('');
  const [championDetail, setChampionDetail] = useState(null);
  const [activeTab, setActiveTab] = useState(config.get(`perkTab`) || Sources.Lolqq);
  const [curPerk, setCurPerk] = useState({});
  const [coordinate, setCoordinate] = useState({ x: 0, y: 0, width: 0, height: 0 });

  useGA({ page: `/runes` });

  useEffect(() => {
    // const mb = new MurderBridge();
    // mb.import().then((v) => {
    //   console.log(v);
    // });

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
      setQQPerkList(result);
    });

    const opggInstance = new Opgg();
    opggInstance.getChampionPerks(champ.id).then((result) => {
      setOPggPerkList(result);
    });

    const mbInstance = new MurderBridge();
    mbInstance.getChampionPerks(champ.id).then((result) => {
      setMBPerks(result);
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

  const renderList = (perkList = []) => {
    const shouldShowList =
      perkList.length && championDetail && perkList[0].alias === championDetail.id;

    if (!shouldShowList) {
      return <Loading className={s.listLoading} />;
    }

    return (
      <Scrollbars
        style={{
          height: `calc(100vh - 180px)`,
        }}>
        {perkList.map((p, idx) => (
          <PerkShowcase
            key={`${championId}-${idx}`}
            idx={idx}
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
    if (!championMap || !qqPerks.length) {
      return <Loading className={s.loading} />;
    }

    return (
      <div className={s.main}>
        {championDetail && (
          <div className={s.drag}>
            <img
              key={championDetail.id}
              className={s.avatar}
              alt={championDetail.name}
              // src={`${DDragonCDNUrl}/${lolVer}/img/champion/${championDetail.id}.png`}
              src={`${QQChampionAvatarPrefix}/${championDetail.id}.png`}
            />
          </div>
        )}

        <Tabs
          activeKey={activeTab}
          onChange={({ activeKey }) => setActiveTab(activeKey)}
          overrides={{
            TabContent: {
              style: () => {
                return {
                  paddingTop: 0,
                  paddingLeft: 0,
                  paddingRight: 0,
                  paddingBottom: 0,
                };
              },
            },
          }}>
          <Tab key={Sources.Lolqq} title={Sources.Lolqq.toUpperCase()}>
            <div className={s.list}>{renderList(qqPerks)}</div>
          </Tab>
          <Tab key={Sources.Opgg} title={Sources.Opgg.toUpperCase()}>
            <div className={s.list}>{renderList(opggPerks)}</div>
          </Tab>
          <Tab key={Sources.MurderBridge} title={Sources.MurderBridge.toUpperCase()}>
            <div className={s.list}>{renderList(mbPerks)}</div>
          </Tab>
        </Tabs>
      </div>
    );
  };

  return (
    <StyletronProvider value={engine}>
      <BaseProvider theme={LightTheme}>{renderContent()}</BaseProvider>
    </StyletronProvider>
  );
}
