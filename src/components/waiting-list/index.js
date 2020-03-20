import s from './style.module.scss';

import React, { useContext } from 'react';

import AppContext from 'src/share/context';

export default () => {
  const { store: { fetching, fetchingSources } } = useContext(AppContext);

  return <div className={s.waitingList}>
    <h3>FETCHING: {fetchingSources.map(s => <b key={s}>{s}</b>)}</h3>
    <ul>
      {
        fetching.map(i =>
          <li key={i.$identity}>
            [{i.source}] fetching: <code>{i.champion}{i.position && `@${i.position}`}</code>
          </li>,
        )
      }
    </ul>
  </div>;
};
