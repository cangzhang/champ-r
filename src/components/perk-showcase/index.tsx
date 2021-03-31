import s from './style.module.scss';

import _noop from 'lodash/noop';

import React, { useRef, FormEvent } from 'react';
import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import { Zap } from 'react-feather';

import { IRuneItem } from "src/typings/commonTypes";
import { MainStyleIds } from 'src/share/constants/runes';

interface IProps {
  isAramMode: boolean;
  onMouseEnter: (perk: IRuneItem, el: HTMLDivElement | null, ev: FormEvent) => void;
  onMouseLeave: () => any;
  perk: IRuneItem;
  onApply: () => any;
}

export default function PerkShowcase({
  perk,
  isAramMode = false,
  onApply,
  onMouseEnter = _noop,
  onMouseLeave = _noop,
}: IProps) {
  const [t] = useTranslation();
  const { primaryStyleId, subStyleId, selectedPerkIds } = perk;
  const pId = selectedPerkIds.find((i) => MainStyleIds[primaryStyleId].includes(+i));
  const el = useRef(null);

  return (
    <div
      className={s.item}
      ref={el}
      onMouseEnter={(ev) => onMouseEnter(perk, el.current, ev)}
      onMouseLeave={onMouseLeave}>
      <div className={s.preview}>
        <div className={cn(s.primary, s[`r-${primaryStyleId}`])} />
        <div className={cn(s[`r-${pId}`], s.big)} />
        <div className={cn(s.sub, s[`r-${subStyleId}`])} />
      </div>

      <div className={s.desc}>
        <div className={s.name}>
          {isAramMode ? `${t(`aram`)}` : `${t(perk.position.toLowerCase())}`}
        </div>
        {!isAramMode && (
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
