/* eslint react-hooks/exhaustive-deps: 0 */
import s from './style.module.scss';

import initI18n from 'src/modules/i18n';
import { ipcRenderer, remote } from 'electron';
import React, { useEffect, useState, useRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { useTranslation } from 'react-i18next';
import { useImmer } from 'use-immer';
import { styled } from 'styletron-react';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';
import { ButtonGroup, SIZE } from 'baseui/button-group';
import { Button } from 'baseui/button';
import { Popover, StatefulPopover, TRIGGER_TYPE } from 'baseui/popover';

import config from 'src/native/config';
import { QQChampionAvatarPrefix } from 'src/share/constants/sources';
import LCUService from 'src/service/lcu';
import Sources, { PkgList } from 'src/share/constants/sources';

import LolQQ from 'src/service/data-source/lol-qq';
import NpmService from 'src/service/data-source/npm-service';

import PerkShowcase from 'src/components/perk-showcase';
import RunePreview from 'src/components/rune-preview';
import Loading from 'src/components/loading-spinner';
import { ReactComponent as PinIcon } from 'src/assets/icons/push-pin.svg';

import { makeChampMap } from './utils';
import { IChampionInfo, IRuneItem, ICoordinate } from 'src/typings/commonTypes';

initI18n();

const engine = new Styletron();
const SourceList = [
  {
    label: `QQ`,
    value: Sources.Lolqq,
  },
  ...PkgList,
];

const Pin = styled(`button`, () => ({
  margin: `0 2ex`,
  height: `2em`,
  width: `2em`,
  ':hover': {
    cursor: `pointer`,
  },
  background: `transparent`,
  border: `unset`,
  padding: `unset`,
  outline: `unset`,
}));
const PinBtn = styled(PinIcon, (props: { $pinned: boolean; }) => ({
  transition: `all linear 0.2s`,
  transform: props.$pinned ? `rotate(-45deg)` : `unset`,
  fill: props.$pinned ? `#276EF1` : `currentColor`,
  height: `1.4em`,
  width: `1.4em`,
}));

const srvInstances = [
  new LolQQ(),
  ...PkgList.map((p) => new NpmService(p.value)),
]

export default function Popup() {
  const lolDir = config.get(`lolDir`);
  const [t] = useTranslation();
  const lcu = useRef<LCUService>();

  const [activeTab, setActiveTab] = useState(config.get(`perkTab`) || Sources.Lolqq);
  const [perkList, setPerkList] = useImmer<IRuneItem[][]>([[], [], []]);
  const [championMap, setChampionMap] = useState<{ [key: string]: IChampionInfo }>();
  const [championId, setChampionId] = useState<number | string>('');
  const [championDetail, setChampionDetail] = useState<IChampionInfo | null>(null);
  const [curPerk, setCurPerk] = useState<IRuneItem | null>(null);
  const [coordinate, setCoordinate] = useState<ICoordinate>({
    x: 0,
    y: 0,
    width: 0,
    height: 0,
  });
  const [showTips, toggleTips] = useState(true);
  const [pinned, togglePinned] = useState(remote.getCurrentWindow().isAlwaysOnTop());
  const instances = useRef(srvInstances);

  useEffect(() => {
    (instances.current[1] as NpmService).getChampionList().then((data) => {
      const champMap = makeChampMap(data);
      setChampionMap(champMap);

      ipcRenderer.on('for-popup', (event, { championId: id }) => {
        if (id) {
          setChampionId(id);
        }
      });
    });
  }, []);

  useEffect(() => {
    if (!championId || !championMap) return;

    const champ = championMap[championId];
    if (!champ) {
      setChampionId(0);
      setChampionDetail(null);
      return;
    }
    setChampionDetail(champ);

    (instances.current[0] as LolQQ).getChampionPerks(champ.key, champ.id).then((result) => {
      setPerkList((draft) => {
        draft[0] = result;
      });
    });

    instances.current.forEach((i, idx) => {
      if (idx === 0) {
        return
      }

      (i as NpmService).getRunesFromCDN(champ.id).then((result) => {
        setPerkList((draft) => {
          draft[idx] = result;
        });
      });
    })
  }, [championId, championMap]);

  useEffect(() => {
    config.set(`perkTab`, activeTab);
  }, [activeTab]);

  const apply = async (perk: IRuneItem) => {
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

  const showPreview = (perk: IRuneItem, el: HTMLDivElement) => {
    setCurPerk(perk);
    if (!el) return;

    const { x, y, width, height } = el.getBoundingClientRect();
    setCoordinate({ x, y, width, height });
  };

  const hidePreview = () => {
    setCurPerk(null);
  };

  const onSelectSource = (_: unknown, idx: number) => {
    setActiveTab(SourceList[idx].value);
  };

  const toggleAlwaysOnTop = () => {
    ipcRenderer.send(`popup:toggle-always-on-top`);
    togglePinned((p) => !p);
  };

  const renderList = (list: IRuneItem[] = [], isAramMode = false) => {
    const shouldShowList = list.length && championDetail && list[0].alias === championDetail.id;

    if (!shouldShowList) {
      return <Loading className={s.listLoading}/>;
    }

    return (
      <Scrollbars
        style={{
          height: `calc(100vh - 5em)`,
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

        <RunePreview perk={curPerk} coordinate={coordinate}/>
      </Scrollbars>
    );
  };

  const renderContent = () => {
    if (!championMap || !perkList[0].length) {
      return <Loading className={s.loading}/>;
    }

    const tabIdx = SourceList.findIndex((i) => i.value === activeTab);
    return (
      <div className={s.main} onClick={() => toggleTips(false)}>
        {championDetail && (
          <div className={s.drag}>
            <StatefulPopover content={t(`pin/unpin`)} triggerType={TRIGGER_TYPE.hover}>
              <Pin onClick={toggleAlwaysOnTop}>
                <PinBtn $pinned={pinned}/>
              </Pin>
            </StatefulPopover>

            <Popover isOpen={showTips} content={t(`drag avatar to move window`)}>
              <img
                key={championDetail.id}
                className={s.avatar}
                alt={championDetail.name}
                src={`${QQChampionAvatarPrefix}/${championDetail.id}.png`}
              />
            </Popover>

            <ButtonGroup
              size={SIZE.compact}
              onClick={onSelectSource}
              selected={[tabIdx]}
              overrides={{
                Root: {
                  style: () => ({
                    flex: 1,
                  }),
                },
              }}>
              {SourceList.map((item) => (
                <Button
                  key={item.value}
                  overrides={{
                    BaseButton: {
                      style: () => {
                        return {
                          userSelect: `none`,
                        };
                      },
                    },
                  }}>
                  {item.label}
                </Button>
              ))}
            </ButtonGroup>
          </div>
        )}

        {perkList[tabIdx] && (
          <div className={s.list}>{renderList(perkList[tabIdx], SourceList[tabIdx].isAram)}</div>
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
