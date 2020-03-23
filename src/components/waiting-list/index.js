import s from './style.module.scss';

import React, { useContext } from 'react';
import cn from 'classnames';

import AppContext from 'src/share/context';

export default () => {
  const { store: { fetching, fetchingSources } } = useContext(AppContext);

  return <div className={s.waitingList}>
    <h3>FETCHING:{fetchingSources.map(s => <b key={s}>{s}</b>)}</h3>
    <ul>
      {
        fetching.map(i =>
          <li key={i.$identity}>
            <span className={s.source}>{i.source}</span>
            <span className={s.champion}>{i.champion}</span>
            <span className={s.at}>@</span>
            {
              i.position &&
              <i className={cn(s.lane, s[i.position])} />
            }
          </li>)
      }
    </ul>
  </div>;
};
