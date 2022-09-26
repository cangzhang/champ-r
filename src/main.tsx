import React from 'react'
import ReactDOM from 'react-dom/client'
import Home from './views/Home/Home'
import './index.css'

import { store } from './config';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <Home store={store} />
  </React.StrictMode>
)
