import './index.scss';

import React from 'react';
import ReactDOM from 'react-dom';

import App from './app';
// import * as serviceWorker from './serviceWorker';

const config = require('./native/config');

if (!config.get(`language`)) {
	const language = navigator.language.replace(`-`, `_`);
	config.set(`language`, language);
}

ReactDOM.render(<App />, document.getElementById('root'));

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
// serviceWorker.unregister();
