import ReactDOM from 'react-dom/client';

import { Toolbar } from './views/Toolbar/Toolbar';
import { Root } from './views/Root/Root';

import './index.scss';

ReactDOM.createRoot(document.getElementById('root')).render(
  <main>
    <Toolbar/>
    <Root/>
  </main>,
);
