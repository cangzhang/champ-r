import s from './app.module.scss';

import { ipcRenderer } from 'electron';
import _find from 'lodash/find';

import React, { useReducer, useMemo, useRef, useEffect } from 'react';
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
import config from 'src/native/config';

import Toolbar from 'src/components/toolbar';
import Home from 'src/modules/home';
import Import from 'src/modules/import';
import Settings from 'src/modules/settings';
import LCUService from 'src/service/lcu';

const engine = new Styletron();

const findUserChampion = (cellId, actions = []) => {
  let id = 0;
  if (!actions || !actions.length)
    return id;

  for(const action of actions) {
    for(const cell of action) {
      if (cell.actorCellId === cellId && cell.type === 'pick') {
        id = cell.championId;
        break;
      }
    }
  }

  return id;
}

const App = () => {
  const [t] = useTranslation();
  const [store, dispatch] = useReducer(appReducer, initialState, init);
  const contextValue = useMemo(() => ({ store, dispatch }), [store, dispatch]);

  const checkTask = useRef(null);
  const lcuInstance = useRef({});

  useEffect(() => {
    checkTask.current = setInterval(async () => {
      try {
        const lolVer = config.get(`lolVer`);
        const lolDir = config.get(`lolDir`);
        if (!lolDir || !lolVer)
          return false;

        if (!lcuInstance.current.getAuthToken) {
          lcuInstance.current = new LCUService(lolDir);
        }
        const lcuIns = lcuInstance.current;
        await lcuIns.getAuthToken();

        if (!lcuIns.active)
          return false;

        const { actions = [], myTeam = []} = await lcuIns.getCurrentSession();
        const member = _find(myTeam, i => i.summonerId > 0) || {};
        const { cellId } = member;
        let championId = 0;

        if (!actions.length && myTeam.length && member) {
          // special mode
          championId = member.championId;
        } else {
          // classic mode
          championId = findUserChampion(cellId, actions);
        }

        if (!championId) {
          throw new Error(`no active session.`)
        }

        console.log(`got champion id: `, championId);
        ipcRenderer.send(`show-popup`, {
          championId,
          position: null,
        });
        return true;
      } catch (_err) {
        if (process.env.IS_DEV)
          return;

        ipcRenderer.send(`hide-popup`);
      }
    }, 2000);

    return () => {
      clearInterval(checkTask.current);
    };
  }, []);

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
