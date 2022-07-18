import s from './style.module.scss';

import React, { useEffect, useState, useRef } from 'react';
import { Scrollbars } from 'react-custom-scrollbars';
import { useTranslation } from 'react-i18next';
import { useImmer } from 'use-immer';

import toast, { Toaster } from 'react-hot-toast';
import { Check, Smile, X } from 'react-feather';
import { styled } from 'styletron-react';
import { StatefulPopover, TRIGGER_TYPE } from 'baseui/popover';
import { Select } from 'baseui/select';
import { useStyletron } from 'baseui';

import { ISourceItem, QQChampionAvatarPrefix, SourceQQ } from 'src/share/constants/sources';

import LolQQ from 'src/service/data-source/lol-qq';

import PerkShowcase from 'src/components/perk-showcase';
import RunePreview from 'src/components/rune-preview';
import Loading from 'src/components/loading-spinner';
import { ReactComponent as PinIcon } from 'src/assets/icons/push-pin.svg';
import { IChampionInfo, IRuneItem, ICoordinate } from '@interfaces/commonTypes';

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
  const [perkMap, setPerkMap] = useImmer<{ [k: string]: IRuneItem[] }>({});
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
  const qqInstance = useRef(new LolQQ());
  const source = activeTab[0].value;

  useEffect(() => {
    window.bridge.on('for-popup', ({ championId: id }: { championId: number }) => {
      if (id) {
        setChampionId(id);
      }
    });
  }, []);

  useEffect(() => {
    if (!championId) {
      return;
    }

    window.bridge.invoke(`GetChampionInfo`, championId).then(c => {
      setChampionDetail(c);

      if (source === SourceQQ.value) {
        qqInstance.current?.getChampionPerks(c.key, c.id)
          .then((result) => {
            setPerkMap((draft) => {
              draft[SourceQQ.value] = result;
            });
          });
        return;
      }

      window.bridge.invoke(`MakeRuneData`, { source, championId }).then(ret => {
        setPerkMap(d => {
          d[source] = ret;
        });
      });
    });
  }, [championId, source, setPerkMap]);

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
      console.log(`apply perk:`, perk.name);
      await window.bridge.invoke(`ApplyRunePage`, perk);
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

  const onClose = () => {
    window.bridge.sendMessage(`hidePopup`);
  };

  const renderList = (list: IRuneItem[] | number, isAramMode = false, isUrf = false) => {
    if (list === 404) {
      return <div className={s.noData}>{t(`no data`)}</div>;
    }

    if (!championDetail || !(list as IRuneItem[]).length) {
      return <Loading className={s.listLoading}/>;
    }

    return (
      <Scrollbars
        style={{
          height: `calc(100vh - 5em)`,
        }}>
        {(list as IRuneItem[]).map((p, idx) => (
          <PerkShowcase
            key={`${championId}-${idx}`}
            idx={idx}
            isAramMode={isAramMode}
            isUrfMode={isUrf}
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
    const pkgName = activeTab[0].value;
    const source = sourceList.find((i) => i.value === pkgName);
    const availablePerks = perkMap[pkgName] ?? [];
    if (!availablePerks.length) {
      return (
        <div className={s.waiting}>
          <Loading className={s.loading}/>
          <button className={s.close} onClick={onClose}>
            <X size={26} color={`#EA4C89`}/>
          </button>
        </div>
      );
    }

    return (
      <div className={s.main}>
        {championDetail && (
          <div className={s.drag}>
            <StatefulPopover content={t(`pin/unpin`)} triggerType={TRIGGER_TYPE.hover}>
              <Pin onClick={toggleAlwaysOnTop}>
                <PinBtn $pinned={pinned}/>
              </Pin>
            </StatefulPopover>

            <StatefulPopover content={t(`hide`)} triggerType={TRIGGER_TYPE.hover}>
              <button className={s.close} onClick={onClose}>
                <X size={26} color={`#EA4C89`}/>
              </button>
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

        {availablePerks.length > 0 && (
          <div className={s.list}>
            {renderList(availablePerks, source?.isAram, source?.isURF)}
          </div>
        )}
      </div>
    );
  };

  return (
    <div>
      {renderContent()}
      <Toaster
        position="bottom-center"
        toastOptions={{
          style: {
            borderRadius: theme.borders.radius300,
            ...theme.typography.ParagraphSmall,
          },
          blank: {
            icon: <Smile size={16}/>,
            duration: 5 * 1000,
            style: {
              backgroundColor: theme.colors.backgroundInverseSecondary,
              color: theme.colors.contentInversePrimary,
            },
          },
          success: {
            icon: <Check/>,
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
