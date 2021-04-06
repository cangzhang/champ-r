import s from './style.module.scss';

import { shell } from 'electron';

import React, { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from 'react-feather';
import { useStyletron } from 'baseui';
import { StatefulTooltip } from 'baseui/tooltip';

export default function Footer() {
  const [t] = useTranslation();
  const [, theme] = useStyletron();

  const onStar = (ev: FormEvent) => {
    ev.preventDefault();
    shell.openExternal(`https://github.com/cangzhang/champ-r`);
  };

  return (
    <div className={s.footer}>
      {process.env.IS_DEV
        ? `dev`
        : process.env.BUILD_IN_CI
        ? `test-${process.env.HEAD}`
        : `v${process.env.APP_VERSION}`}
      <StatefulTooltip accessibilityType={'tooltip'} content={t(`star it`)}>
        <a className={s.star} href='#champ-r' onClick={onStar}>
          <Star size={16} color={theme.colors.warning} />
        </a>
      </StatefulTooltip>
    </div>
  );
}
