import s from './app.module.scss';

import React, { useReducer, useMemo } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';

import AppContext from 'src/share/context';
import appReducer, {
  initialState,
  init,
} from 'src/share/reducer';

import Toolbar from 'src/components/toolbar';
import Home from 'src/modules/home';
import Import from 'src/modules/import';

const engine = new Styletron();

const App = () => {
  const [store, dispatch] = useReducer(appReducer, initialState, init);
  const contextValue = useMemo(() => ({ store, dispatch }), [store, dispatch]);

  return (
    <AppContext.Provider value={contextValue}>
      <StyletronProvider value={engine}>
        <BaseProvider theme={LightTheme}>
          <Toolbar />
          <Router>
            <Switch>
              <Route exact path={'/'} component={Home} />
              <Route path={`/import`} component={Import} />
            </Switch>
          </Router>
          <div className={s.appVer}>App Version: {process.env.APP_VERSION}</div>
        </BaseProvider>
      </StyletronProvider>
    </AppContext.Provider>
  );
};

export default App;
