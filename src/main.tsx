import ReactDOM from 'react-dom/client';
import { defaultTheme, Provider } from '@adobe/react-spectrum';

import { Toolbar } from './views/Toolbar/Toolbar';
import { Root } from './views/Root/Root';

import './index.scss';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <Provider theme={defaultTheme}>
    <Toolbar/>
    <Root/>
  </Provider>,
);
