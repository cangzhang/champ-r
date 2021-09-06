import './index.scss';

import initLogger from 'src/native/logger';
import initI18n from 'src/modules/i18n';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './app';

initLogger();
initI18n();

ReactDOM.render(<App/>, document.querySelector('#root'));
