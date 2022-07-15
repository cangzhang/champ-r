import s from './style.module.scss';

import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { StatefulTooltip } from 'baseui/tooltip';
import { Settings, Minimize2, X } from 'react-feather';

const Toolbar = () => {
  const [t] = useTranslation();
  const navigate = useNavigate();

  const onHide = () => {
    window.bridge.sendMessage(`toggle-main-window`);
  };
  const onClose = () => {
    window.bridge.sendMessage(`quit-app`);
  };

  return (
    <div className={s.toolbar}>
      <StatefulTooltip accessibilityType={'tooltip'} content={t(`minimize`)}>
        <span className={s.icon} onClick={onHide}>
          <Minimize2 size={16} />
        </span>
      </StatefulTooltip>

      <StatefulTooltip accessibilityType={'tooltip'} content={t(`settings`)}>
        <span className={s.icon} onClick={() => navigate(`/settings`, { replace: true })}>
          <Settings size={16} />
        </span>
      </StatefulTooltip>

      <StatefulTooltip accessibilityType={'tooltip'} content={t(`close`)}>
        <span className={s.icon} onClick={onClose}>
          <X size={16} />
        </span>
      </StatefulTooltip>
    </div>
  );
};

export default Toolbar;
