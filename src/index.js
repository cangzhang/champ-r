import './index.scss';

import 'src/native/logger';
import 'src/modules/i18n';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './app';

ReactDOM.render(<App />, document.querySelector('#root'));
