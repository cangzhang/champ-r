import ReactDOM from 'react-dom/client'
import { NextUIProvider } from '@nextui-org/react';

import Home from './views/Home/Home'
import { Toolbar } from './views/Toobar/Toolbar';

import './index.css'

ReactDOM.createRoot(document.getElementById('root')!).render(
    <NextUIProvider>
        <Toolbar />
        <Home />
    </NextUIProvider>
)
