import s from './style.module.scss';

import React from 'react';
import cn from 'classnames';
import { Zap } from 'react-feather';

import { MainStyleIds } from 'src/share/constants/runes';

export default function PerkShowcase({ perk, onApply }) {
  const { primaryStyleId, subStyleId, selectedPerkIds } = perk;
  const pId = selectedPerkIds.find(i => MainStyleIds[primaryStyleId].includes(+i));

  return <div className={s.item}>
    <div className={s.preview}>
      <div className={cn(s.primary, s[primaryStyleId])} />
      <div className={cn(s[pId], s.big)} />
      <div className={cn(s.sub, s[subStyleId])} />
    </div>

    <div className={s.desc}>
      <div>{perk.alias} @ {perk.position}</div>
      <div className={s.detail}>
        Pick count: {perk.pickCount} / Win ratio: {perk.wRate}%
      </div>
    </div>

    <div className={s.apply} onClick={onApply}>
      <Zap color={`#21A453`} size={36}/>
    </div>
  </div>;
}
