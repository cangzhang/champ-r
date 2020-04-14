import s from './style.module.scss';

import React from 'react';
import cn from 'classnames';

import { MainStyleIds } from 'src/share/constants/runes';

export default function PerkShowcase({ perk }) {
  const { primaryStyleId, subStyleId, selectedPerkIds } = perk;
  const pId = selectedPerkIds.find(i => MainStyleIds[primaryStyleId].includes(+i))

  return <div className={s.item}>
    <div className={cn(s.primary, s[primaryStyleId])} />
    <div className={cn(s[pId])} />
    <div className={cn(s.sub, s[subStyleId])} />
  </div>;
}
