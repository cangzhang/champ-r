import s from './style.module.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import cn from 'classnames';

import { FragmentMap } from 'src/share/constants/runes';
import { IRuneItem, ICSSProperties, ICoordinate } from '@interfaces/commonTypes';
import { RuneRoot, RuneSlot } from 'src/types';

interface IProps {
  perk: IRuneItem | null;
  coordinate: ICoordinate;
  runes: RuneRoot[];
}

export default function RunePreview({ perk, coordinate, runes }: IProps) {
  const { primaryStyleId = 0, subStyleId = 0, selectedPerkIds } = perk ?? {
    primaryStyleId: 0,
    subStyleId: 0,
    selectedPerkIds: [],
  };
  const mainSlot = runes.find((i) => i.id === primaryStyleId);
  const subSlot = runes.find((i) => i.id === subStyleId);

  const renderRow = (isFragment = false) => {
    const showAllRunes = window.innerWidth >= 380;

    return (slot: RuneSlot, idx: number) => {
      return (
        <div className={s.row} key={idx}>
          {slot.runes.map(({ id, icon }) => {
            let selected = (selectedPerkIds as number[]).includes(id);
            if (isFragment) {
            }

            if (!selected && !showAllRunes) {
              return null;
            }

            return (
              // <div key={id} className={cn(s.runeImg, s[`rune-${id}`], selected && s.selected)} />
              <div key={id} className={cn(s.runeImg, selected && s.selected)}>
                <img src={`https://ddragon.leagueoflegends.com/cdn/img/${icon}`} alt='' />
              </div>
            );
          })}
        </div>
      );
    };
  };

  const left = coordinate.width / 2;
  const total = coordinate.y + coordinate.height;
  const up = total > window.innerHeight - 160;
  const top = up ? coordinate.y : total;

  if (!primaryStyleId || !coordinate.height) {
    return null;
  }

  const style: ICSSProperties = {
    '--left': `${left}px`,
    '--top': `${top}px`,
  };

  return ReactDOM.createPortal(
    <div style={style} className={cn(s.main, up && s.up)}>
      <span className={cn(s.bot, s.triangle)} />
      <span className={cn(s.top, s.triangle)} />
      <div className={s.col}>{mainSlot?.slots.map(renderRow())}</div>
      <div className={s.col}>{subSlot?.slots.map(renderRow())}</div>
      {/*<div className={cn(s.col, s.fragment)}>{FragmentMap.map(renderRow(true))}</div>*/}
    </div>,
    document.querySelector(`#popup`) as HTMLDivElement,
  );
}
