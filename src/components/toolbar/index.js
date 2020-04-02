import s from './style.module.scss';

import React from 'react';
import { useHistory } from 'react-router-dom';
import { CheckIndeterminate as MinimalizeIcon, Delete as CloseIcon } from 'baseui/icon';
import { Settings } from 'react-feather';

const { remote } = require('electron');

const Toolbar = () => {
  const history = useHistory();

  const onHide = () => {
    remote.BrowserWindow.getFocusedWindow().minimize();
  };
  const onClose = () => {
    remote.BrowserWindow.getFocusedWindow().close();
  };

  return <div className={s.toolbar}>
    <Settings title={`Settings`} onClick={() => history.replace(`/settings`)} />
    <MinimalizeIcon title={`Minimize`} onClick={onHide} />
    <CloseIcon title={`Close`} onClick={onClose} />
  </div>;
};

export default Toolbar;
