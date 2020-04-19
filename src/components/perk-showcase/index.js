import s from './style.module.scss';

import React from 'react';
import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import { Zap } from 'react-feather';

import { MainStyleIds } from 'src/share/constants/runes';

export default function PerkShowcase({ perk, onApply }) {
  const [t] = useTranslation();
  const { primaryStyleId, subStyleId, selectedPerkIds } = perk;
  const pId = selectedPerkIds.find(i => MainStyleIds[primaryStyleId].includes(+i));

  return <div className={s.item}>
    <div className={s.preview}>
      <div className={cn(s.primary, s[primaryStyleId])}/>
      <div className={cn(s[pId], s.big)}/>
      <div className={cn(s.sub, s[subStyleId])}/>
    </div>

    <div className={s.desc}>
      <div>{perk.alias} @ {perk.position}</div>
      <div className={s.detail}>
        <span className={s.pick}>{t(`pick count`)} <span className={s.value}>{perk.pickCount}</span></span>
        <span className={s.win}>{t(`win ratio`)} <span className={s.value}>{perk.wRate}%</span></span>
      </div>
    </div>

    <div
      className={s.apply}
      title={t(`apply perk`)}
      onClick={onApply}
    >
      <Zap color={`#21A453`} size={36}/>
    </div>
  </div>;
}
