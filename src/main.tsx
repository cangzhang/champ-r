import ReactDOM from 'react-dom/client';

import './index.scss';
import { Root } from './views/Root/Root';
import { Toolbar } from './views/Toolbar/Toolbar';

ReactDOM.createRoot(document.getElementById('root')).render(
  <main>
    <Toolbar />
    <Root />
  </main>
);
