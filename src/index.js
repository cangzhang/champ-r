import './index.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import './modules/i18n';
import App from './app';
// Import * as serviceWorker from './serviceWorker';
import config from 'src/native/config';

if (!config.get('appLang')) {
  config.set('appLang', navigator.language);
}

ReactDOM.render(<App />, document.querySelector('#root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
