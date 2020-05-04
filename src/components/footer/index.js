import s from './style.module.scss';

import { shell } from 'electron';

import React from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from 'react-feather';
import { useStyletron } from 'baseui';
import { StatefulTooltip } from 'baseui/tooltip';

export default function Footer() {
  const [t] = useTranslation();
  const [, theme] = useStyletron();

  const star = (ev) => {
    ev.preventDefault();
    shell.openItem(`https://github.com/cangzhang/champ-r`);
  };

  return (
    <div className={s.footer}>
      {t('app version')}: {process.env.APP_VERSION}
      <StatefulTooltip accessibilityType={'tooltip'} content={t(`star it`)}>
        <a className={s.star} href='#champ-r' onClick={star}>
          <Star size={16} color={theme.colors.warning} />
        </a>
      </StatefulTooltip>
    </div>
  );
}
