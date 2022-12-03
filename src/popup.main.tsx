import React from 'react';
import ReactDOM from 'react-dom/client';

import { Provider, defaultTheme } from '@adobe/react-spectrum';

import { RuneOverview } from './views/RuneOverview/RuneOverview';

import './index.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider theme={defaultTheme}>
    <RuneOverview/>
  </Provider>,
);
