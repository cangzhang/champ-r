import ReactDOM from 'react-dom/client';
import { NextUIProvider } from '@nextui-org/react';

import { Toolbar } from './views/Toolbar/Toolbar';
import { Root } from './views/Root/Root';

import './index.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <NextUIProvider>
    <Toolbar/>
    <Root/>
  </NextUIProvider>
);
