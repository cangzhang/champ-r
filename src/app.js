import { ipcRenderer, shell } from 'electron';
import _find from 'lodash/find';

import React, { useReducer, useMemo, useRef, useEffect } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';

import AppContext from 'src/share/context';
import appReducer, { initialState, init, setLolVersion, updateItemMap } from 'src/share/reducer';
import config from 'src/native/config';
import { getItemList, getLolVer } from 'src/service/data-source/lol-qq';
import LCUService from 'src/service/lcu';

import Footer from 'src/components/footer';
import Toolbar from 'src/components/toolbar';
import Home from 'src/modules/home';
import Import from 'src/modules/import';
import Settings from 'src/modules/settings';

const engine = new Styletron();
const GameTypes = [`pick`];

const findUserChampion = (cellId, actions = []) => {
  let id = 0;
  if (!actions || !actions.length) return id;

  for (const action of actions) {
    for (const cell of action) {
      if (cell.actorCellId === cellId && GameTypes.includes(cell.type)) {
        id = cell.championId;
        break;
      }
    }
  }

  return id;
};

const App = () => {
  const [store, dispatch] = useReducer(appReducer, initialState, init);
  const contextValue = useMemo(() => ({ store, dispatch }), [store, dispatch]);

  const checkTask = useRef(null);
  const lcuInstance = useRef({});

  useEffect(() => {
    checkTask.current = setInterval(async () => {
      try {
        const lolDir = config.get(`lolDir`);
        if (!lolDir) {
          console.err(`lol folder not selected.`);
          return false;
        }

        if (!lcuInstance.current.getAuthToken) {
          lcuInstance.current = new LCUService(lolDir);
        }
        const lcuIns = lcuInstance.current;
        await lcuIns.getAuthToken();

        if (!lcuIns.active) {
          console.err(`lcu not running.`);
          return false;
        }

        const {
          actions = [],
          myTeam = [],
          localPlayerCellId: cellId,
        } = await lcuIns.getCurrentSession();

        const me = _find(myTeam, (i) => i.summonerId > 0 && i.cellId === cellId) || {};
        const { championId: mChampionId } = me;
        let championId;

        const isRandomMode = !actions.length && myTeam.length > 0 && mChampionId > 0;
        const isVoteMode =
          mChampionId > 0 && myTeam.length > 0 && myTeam.every((i) => i.championId === mChampionId);

        championId = findUserChampion(cellId, actions);
        console.log(`isRandomMode: ${isRandomMode}, isVoteMode: ${isVoteMode}, My pick: ${cellId}`);

        if (isRandomMode || isVoteMode) {
          // special mode
          championId = me.championId;
        }

        if (!championId) {
          console.log(`no matched.`);
          throw new Error(`no active session.`);
        }

        console.log(`got champion id: `, championId);
        ipcRenderer.send(`show-popup`, {
          championId,
          position: null,
        });

        console.log(`show popup.`);
        return true;
      } catch (_err) {
        console.error(`cannot show popup.`);
        if (process.env.IS_DEV) return;

        ipcRenderer.send(`hide-popup`);
      }
    }, 1600);

    return () => {
      clearInterval(checkTask.current);
    };
  }, []);

  useEffect(() => {
    const getVerAndItems = async () => {
      const v = await getLolVer();
      dispatch(setLolVersion(v));
      config.set(`lolVer`, v);

      const appLang = config.get('appLang');
      const language = appLang.replace('-', '_');
      const data = await getItemList(v, language);

      dispatch(
        updateItemMap({
          ...data,
        }),
      );
    };

    getVerAndItems();

    ipcRenderer.on(`update-available`, (ev, info) => {
      const notify = new Notification(`New version available: ${info.version}`);

      notify.onclick = () => {
        shell.openItem(`https://github.com/cangzhang/champ-r/releases`);
      };
    });

    // ipcRenderer.on(`update-downloaded`, () => {});
  }, []);

  return (
    <AppContext.Provider value={contextValue}>
      <StyletronProvider value={engine}>
        <BaseProvider theme={LightTheme}>
          <Router>
            <Toolbar />
            <Switch>
              <Route exact path={'/'}>
                <Home />
              </Route>
              <Route path={`/import`}>
                <Import />
              </Route>
              <Route path={`/settings`}>
                <Settings />
              </Route>
            </Switch>
          </Router>
          <Footer />
        </BaseProvider>
      </StyletronProvider>
    </AppContext.Provider>
  );
};

export default App;
