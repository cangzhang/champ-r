import s from './style.module.scss';

import React from 'react';
import ReactDOM from 'react-dom';
import cn from 'classnames';

import { MainRuneMap, SubRuneMap, FragmentMap } from 'src/share/constants/runes';
import { IRuneItem, ICSSProperties } from "src/typings/commonTypes";

interface ICoordinate extends ClientRect {
  x: number;
  y: number;
}

interface IProps {
  perk: IRuneItem;
  coordinate: ICoordinate;
}

export default function RunePreview({ perk, coordinate }: IProps) {
  const { primaryStyleId = 0, subStyleId = 0, selectedPerkIds } = perk;
  const mainIds = MainRuneMap[primaryStyleId];
  const subIds = SubRuneMap[subStyleId];

  const renderRow = (isFragment = false) => {
    const selectedFIds = selectedPerkIds.slice(-3);
    const showAllRunes = window.innerWidth >= 380;

    return (ids: number[], idx: number) => {
      return (
        <div className={s.row} key={idx}>
          {ids.map((id) => {
            let selected = selectedPerkIds.includes(id);
            if (isFragment) {
              const selectedFId = selectedFIds[idx];
              selected = ids.includes(selectedFId) && id === selectedFId;
            }

            if (!selected && !showAllRunes) {
              return null;
            }

            return (
              <div key={id} className={cn(s.runeImg, s[`rune-${id}`], selected && s.selected)} />
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
  }

  return ReactDOM.createPortal(
    <div
      style={style}
      className={cn(s.main, up && s.up)}>
      <span className={cn(s.bot, s.triangle)} />
      <span className={cn(s.top, s.triangle)} />
      <div className={s.col}>{mainIds.map(renderRow())}</div>
      <div className={s.col}>{subIds.map(renderRow())}</div>
      <div className={cn(s.col, s.fragment)}>{FragmentMap.map(renderRow(true))}</div>
    </div>,
    document.querySelector(`#popup`) as HTMLDivElement,
  );
}
