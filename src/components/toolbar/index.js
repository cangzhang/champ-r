import s from './style.module.scss';

import React from 'react';
import { CheckIndeterminate as MinimalizeIcon, Delete as CloseIcon } from 'baseui/icon';

const { remote } = require('electron');

const Toolbar = () => {
  const onHide = () => {
    remote.BrowserWindow.getFocusedWindow().minimize();
  };

  const onClose = () => {
    remote.BrowserWindow.getFocusedWindow().close();
  };

  return <div className={s.toolbar}>
    <MinimalizeIcon onClick={onHide} />
    <CloseIcon onClick={onClose} />
  </div>;
};

export default Toolbar;
