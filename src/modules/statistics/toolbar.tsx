import s from './style.module.scss';

import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';

import { StatefulTooltip } from 'baseui/tooltip';
import { X, Lock, Unlock } from 'react-feather';

const Toolbar = () => {
  const [t] = useTranslation();

  const [pinned, togglePinned] = useState(
    window.bridge.appConfig.get(`statistics.alwaysOnTop`) as boolean,
  );

  const toggleAlwaysOnTop = () => {
    window.bridge.sendMessage(`statistics:toggle-always-on-top`);
    togglePinned((p) => !p);
  };

  const onClose = () => {
    window.bridge.sendMessage(`quit-statistics`);
  };

  return (
    <div className={s.toolbar}>
      <StatefulTooltip accessibilityType={'tooltip'} content={t(`pin/unpin`)}>
        <span className={s.icon} onClick={toggleAlwaysOnTop}>
          {pinned ? <Lock size={16} /> : <Unlock size={16} />}
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
