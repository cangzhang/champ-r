import s from './style.module.scss';

import React from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { StatefulTooltip } from 'baseui/tooltip';
import { Settings, Minimize2, X } from 'react-feather';

const { remote } = require('electron');

const Toolbar = () => {
  const [t] = useTranslation();
  const history = useHistory();

  const onHide = () => {
    remote.BrowserWindow.getFocusedWindow().minimize();
  };
  const onClose = () => {
    remote.BrowserWindow.getFocusedWindow().close();
  };

  return <div className={s.toolbar}>
    <StatefulTooltip
      accessibilityType={'tooltip'}
      content={t(`settings`)}
    >
      <span
        className={s.icon}
        onClick={() => history.replace(`/settings`)}
      >
        <Settings size={16} />
      </span>
    </StatefulTooltip>

    <StatefulTooltip
      accessibilityType={'tooltip'}
      content={t(`minimize`)}
    >
      <span className={s.icon} onClick={onHide} ><Minimize2 size={16} /></span>
    </StatefulTooltip>

    <StatefulTooltip
      accessibilityType={'tooltip'}
      content={t(`close`)}
    >
      <span className={s.icon} onClick={onClose} ><X size={16} /></span>
    </StatefulTooltip>
  </div>;
};

export default Toolbar;
