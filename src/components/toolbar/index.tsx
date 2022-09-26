import s from './style.module.scss';

import React, { FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { StatefulTooltip } from 'baseui/tooltip';
import { StatefulPopover } from 'baseui/popover';
import { Block } from 'baseui/block';
import { Settings, Minimize2, X, HelpCircle } from 'react-feather';

const Toolbar = () => {
  const [t] = useTranslation();
  const navigate = useNavigate();

  const onHide = () => {
    window.bridge.sendMessage(`toggle-main-window`);
  };

  const onClose = () => {
    window.bridge.sendMessage(`quit-app`);
  };

  const onFaq = (link: string) => (ev: FormEvent) => {
    ev.preventDefault();
    window.shell.openExternal(link);
  };

  return (
    <div className={s.toolbar}>
      <StatefulTooltip accessibilityType={'tooltip'} content={t(`faq`)}>
        <StatefulPopover
          content={() => (
            <Block padding={'10px'} className={s.faqTips}>
              <div className={s.item}>
                <i
                  className="bx bxl-github bx-sm bx-border bx-tada-hover"
                  onClick={onFaq(`https://github.com/cangzhang/champ-r/wiki/FAQ`)}
                />
                GitHub
              </div>
              <div className={s.divider} />
              <div className={s.item}>
                <i
                  className="bx bxs-file-doc bx-sm bx-border bx-tada-hover"
                  onClick={onFaq(`https://champr-official.feishu.cn/docx/doxcnNasMlp9HZ9kVWr3GzxWref`)}
                />
                {t(`mirror`)}
              </div>
            </Block>
          )}
          returnFocus
          autoFocus
        >
        <span className={s.icon}>
          <HelpCircle size={16}/>
        </span>
        </StatefulPopover>
      </StatefulTooltip>

      <StatefulTooltip accessibilityType={'tooltip'} content={t(`minimize`)}>
        <span className={s.icon} onClick={onHide}>
          <Minimize2 size={16}/>
        </span>
      </StatefulTooltip>

      <StatefulTooltip accessibilityType={'tooltip'} content={t(`settings`)}>
        <span className={s.icon} onClick={() => navigate(`/settings`, { replace: true })}>
          <Settings size={16}/>
        </span>
      </StatefulTooltip>

      <StatefulTooltip accessibilityType={'tooltip'} content={t(`close`)}>
        <span className={s.icon} onClick={onClose}>
          <X size={16}/>
        </span>
      </StatefulTooltip>
    </div>
  );
};

export default Toolbar;
