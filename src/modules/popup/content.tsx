import s from './style.module.scss';

import React, { useEffect, useState, useRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { useTranslation } from 'react-i18next';
import { useImmer } from 'use-immer';

import toast, { Toaster } from 'react-hot-toast';
import { Check, Smile } from 'react-feather';
import { styled } from 'styletron-react';
import { StatefulPopover, TRIGGER_TYPE } from 'baseui/popover';
import { Select } from 'baseui/select';
import { useStyletron } from 'baseui';

import { ISourceItem, QQChampionAvatarPrefix } from 'src/share/constants/sources';

import LolQQ from 'src/service/data-source/lol-qq';
import CdnService from 'src/service/data-source/cdn-service';

import PerkShowcase from 'src/components/perk-showcase';
import RunePreview from 'src/components/rune-preview';
import Loading from 'src/components/loading-spinner';
import { ReactComponent as PinIcon } from 'src/assets/icons/push-pin.svg';

import { IChampionInfo, IRuneItem, ICoordinate } from '@interfaces/commonTypes';
import { makeChampMap } from './utils';
import { createIpcPromise } from 'src/service/ipc';

const Pin = styled(`button`, () => ({
  margin: `0 2ex 0 0`,
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
const PinBtn = styled(PinIcon, (props: { $pinned: boolean }) => ({
  transition: `all linear 0.2s`,
  transform: props.$pinned ? `rotate(-45deg)` : `unset`,
  fill: props.$pinned ? `#276EF1` : `currentColor`,
  height: `1.4em`,
  width: `1.4em`,
}));

const getInitTab = () => {
  const cur = window.bridge.appConfig.get(`perkTab`);
  const sourceList: ISourceItem[] = window.bridge.appConfig.get(`sourceList`);
  return [sourceList.find((i) => i.value === cur) ?? sourceList[0]];
};

export function Content() {
  const [t] = useTranslation();
  const [, theme] = useStyletron();
  const sourceList: ISourceItem[] = window.bridge.appConfig.get(`sourceList`);

  const [activeTab, setActiveTab] = useState<ISourceItem[]>(getInitTab());
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
  const [pinned, togglePinned] = useState(
    window.bridge.appConfig.get(`popup.alwaysOnTop`) as boolean,
  );
  const instances = useRef([
    new LolQQ(),
    ...sourceList.slice(1).map((p) => new CdnService(p.value)),
  ]); // exclude the `qq` source

  useEffect(() => {
    (instances.current[1] as CdnService).getChampionList().then((data) => {
      const champMap = makeChampMap(data);
      setChampionMap(champMap);

      window.bridge.on('for-popup', ({ championId: id }: { championId: number }) => {
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
        return;
      }

      (i as CdnService)
        .getRunesFromCDN(champ.id)
        .then((result) => {
          setPerkList((draft) => {
            draft[idx] = result;
          });
        })
        .catch((err) => {
          console.error(err);
        });
    });
  }, [championId, championMap, setPerkList]);

  useEffect(() => {
    window.bridge.appConfig.set(`perkTab`, activeTab);
  }, [activeTab]);

  useEffect(() => {
    window.bridge.appConfig.set(`perkTab`, activeTab[0].value);
  }, [activeTab]);

  useEffect(() => {
    toast(t(`drag avatar to move window`));
  }, []); // eslint-disable-line

  const apply = async (perk: IRuneItem) => {
    try {
      await createIpcPromise(`applyRunePage`, perk);
      console.info(`[popup] applied selected perk`);
      toast.dismiss();
      toast.success(t(`applied`));
    } catch (_err) {
      console.error(`[popup] apply perk failed`);
    }
  };

  const showPreview = (perk: IRuneItem, el: HTMLDivElement | null) => {
    setCurPerk(perk);
    if (!el) return;

    const { x, y, width, height } = el.getBoundingClientRect();
    setCoordinate({ x, y, width, height });
  };

  const hidePreview = () => {
    setCurPerk(null);
  };

  const onTabChange = ({ value }: any) => {
    setActiveTab(value);
  };

  const toggleAlwaysOnTop = () => {
    window.bridge.sendMessage(`popup:toggle-always-on-top`);
    togglePinned((p) => !p);
  };

  const renderList = (list: IRuneItem[] = [], isAramMode = false) => {
    const shouldShowList = list.length && championDetail && list[0].alias === championDetail.id;

    if (!shouldShowList) {
      return <Loading className={s.listLoading} />;
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

        <RunePreview perk={curPerk} coordinate={coordinate} />
      </Scrollbars>
    );
  };

  const renderContent = () => {
    if (!championMap || !perkList[0].length) {
      return <Loading className={s.loading} />;
    }

    const tabIdx = sourceList.findIndex((i) => i.value === activeTab[0].value);
    return (
      <div className={s.main}>
        {championDetail && (
          <div className={s.drag}>
            <StatefulPopover content={t(`pin/unpin`)} triggerType={TRIGGER_TYPE.hover}>
              <Pin onClick={toggleAlwaysOnTop}>
                <PinBtn $pinned={pinned} />
              </Pin>
            </StatefulPopover>

            <img
              key={championDetail.id}
              className={s.avatar}
              alt={championDetail.name}
              src={`${QQChampionAvatarPrefix}/${championDetail.id}.png`}
            />

            <Select
              backspaceRemoves={false}
              clearable={false}
              deleteRemoves={false}
              escapeClearsValue={false}
              options={sourceList}
              onBlurResetsInput={false}
              onCloseResetsInput={false}
              onSelectResetsInput={false}
              searchable={false}
              labelKey={`label`}
              valueKey={`value`}
              value={activeTab}
              onChange={onTabChange}
              overrides={{
                Root: {
                  style: ({ $theme }) => ({
                    width: `13em`,
                    outline: `${$theme.colors.positive100} solid`,
                  }),
                },
                DropdownListItem: {
                  style: () => ({
                    textTransform: `uppercase`,
                  }),
                },
                ValueContainer: {
                  style: () => ({
                    textTransform: `uppercase`,
                  }),
                },
              }}
            />
          </div>
        )}

        {perkList[tabIdx] && (
          <div className={s.list}>{renderList(perkList[tabIdx], sourceList[tabIdx].isAram)}</div>
        )}
      </div>
    );
  };

  return (
    <div>
      {renderContent()}
      <Toaster
        position='bottom-center'
        toastOptions={{
          style: {
            borderRadius: theme.borders.radius300,
            ...theme.typography.ParagraphSmall,
          },
          blank: {
            icon: <Smile size={16} />,
            duration: 100 * 1000,
            style: {
              backgroundColor: theme.colors.backgroundInverseSecondary,
              color: theme.colors.contentInversePrimary,
            },
          },
          success: {
            icon: <Check />,
            style: {
              backgroundColor: theme.colors.backgroundPositive,
              color: theme.colors.backgroundPrimary,
            },
          },
        }}
      />
    </div>
  );
}
