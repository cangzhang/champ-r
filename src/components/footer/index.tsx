import s from './style.module.scss';

import { shell } from 'electron';

import React, { FormEvent } from 'react';
import { useTranslation } from 'react-i18next';
import { Star } from 'react-feather';
import { useStyletron } from 'baseui';
import { StatefulTooltip } from 'baseui/tooltip';
import cn from 'classnames'

import { ReactComponent as SendIcon } from 'feather-icons/dist/icons/send.svg';

export default function Footer() {
  const [t] = useTranslation();
  const [, theme] = useStyletron();

  const onOpenLink = (link: string) => (ev: FormEvent) => {
    ev.preventDefault();
    shell.openExternal(link);
  };

  return (
    <div className={s.footer}>
      {process.env.IS_DEV
        ? `dev`
        : process.env.BUILD_IN_CI
          ? `test-${process.env.HEAD}`
          : `v${process.env.APP_VERSION}`}
      <StatefulTooltip accessibilityType={'tooltip'} content={t(`star it`)}>
        <a className={cn(s.icons, s.star)} href='#champ-r' onClick={onOpenLink(`https://github.com/cangzhang/champ-r`)}>
          <Star size={16} color={theme.colors.warning}/>
        </a>
      </StatefulTooltip>
      <StatefulTooltip accessibilityType={'tooltip'} content={`Telegram`}>
        <a className={cn(s.icons)} href='#telegram' onClick={onOpenLink(`https://t.me/champ_r`)}>
          <SendIcon width={16} height={16} color={theme.colors.accent400}/>
        </a>
      </StatefulTooltip>
    </div>
  );
}
