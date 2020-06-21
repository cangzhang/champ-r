import s from './style.module.scss';

import React, { useContext } from 'react';
import cn from 'classnames';
import { useTranslation } from 'react-i18next';
import { H6 } from 'baseui/typography';

import AppContext from 'src/share/context';

export default () => {
  const [t] = useTranslation();
  const {
    store: { fetching, fetchingSources },
  } = useContext(AppContext);

  return (
    <div className={s.waitingList}>
      <H6 className={s.title}>
        {t(`fetching`)}: {fetchingSources.join(`, `)}
      </H6>
      <ul>
        {fetching.map((i) => (
          <li key={i.$identity}>
            <span className={s.source}>{i.source}</span>
            <span className={s.champion}>{i.champion}</span>
            {i.position && (
              <>
                <span className={s.at}>@</span>
                <i className={cn(s.lane, s[i.position])} />
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
};
