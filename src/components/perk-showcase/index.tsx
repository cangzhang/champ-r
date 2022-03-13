import s from './style.module.scss';

import _noop from 'lodash/noop';

import React, { useRef } from 'react';
import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import { Zap } from 'react-feather';

import { IRuneItem } from '@interfaces/commonTypes';
import { MainStyleIds } from 'src/share/constants/runes';

interface IProps {
  isAramMode?: boolean;
  isUrfMode?: boolean;
  onMouseEnter: (perk: IRuneItem, el: HTMLDivElement | null) => void;
  onMouseLeave: () => any;
  perk: IRuneItem;
  onApply: () => any;
  idx?: number;
}

export default function PerkShowcase({
  perk,
  isAramMode = false,
  isUrfMode = false,
  onApply,
  onMouseEnter = _noop,
  onMouseLeave = _noop,
}: IProps) {
  const [t] = useTranslation();
  const { primaryStyleId, subStyleId, selectedPerkIds } = perk;
  const pId = selectedPerkIds.find((i) => MainStyleIds[primaryStyleId].includes(+i));
  const el = useRef(null);

  const shouldShowStatistics = perk.winRate?.length > 0 && perk.pickCount > 0;

  const displayPosition = (position = ``) => {
    if (isAramMode) {
      return t(`aram`);
    }
    if (isUrfMode) {
      return t(`urf`);
    }
    return t(position.toLowerCase());
  };

  return (
    <div
      className={s.item}
      ref={el}
      onMouseEnter={() => onMouseEnter(perk, el.current)}
      onMouseLeave={onMouseLeave}>
      <div className={s.preview}>
        <div className={cn(s.primary, s[`r-${primaryStyleId}`])} />
        <div className={cn(s[`r-${pId}`], s.big)} />
        <div className={cn(s.sub, s[`r-${subStyleId}`])} />
      </div>

      <div className={s.desc}>
        <div className={s.name}>{displayPosition(perk.position)}</div>
        {shouldShowStatistics && (
          <div className={s.detail}>
            <span className={s.pick}>
              {t(`pick count`)} <span className={s.value}>{perk.pickCount}</span>
            </span>
            <span className={s.win}>
              {t(`win ratio`)} <span className={s.value}>{perk.winRate.replace(`%`, ``)}%</span>
            </span>
          </div>
        )}
      </div>

      <div className={s.apply} title={t(`apply perk`)} onClick={onApply}>
        <Zap color={`#21A453`} size={36} />
      </div>
    </div>
  );
}
