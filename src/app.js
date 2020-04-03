import s from './app.module.scss';

import React, { useReducer, useMemo } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

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
import Settings from 'src/modules/settings';

const engine = new Styletron();

const App = () => {
  const [t] = useTranslation();
  const [store, dispatch] = useReducer(appReducer, initialState, init);
  const contextValue = useMemo(() => ({ store, dispatch }), [store, dispatch]);

  return (
    <AppContext.Provider value={contextValue}>
      <StyletronProvider value={engine}>
        <BaseProvider theme={LightTheme}>
          <Router>
            <Toolbar />
            <Switch>
              <Route exact path={'/'} component={Home} />
              <Route path={`/import`} component={Import} />
              <Route path={`/settings`} component={Settings} />
            </Switch>
          </Router>
          <div className={s.appVer}>{t('app version')}: {process.env.APP_VERSION}</div>
        </BaseProvider>
      </StyletronProvider>
    </AppContext.Provider>
  );
};

export default App;
