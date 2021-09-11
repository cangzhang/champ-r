import { ipcRenderer, shell } from 'electron';
import _find from 'lodash/find';

import React, { useReducer, useMemo, useRef, useEffect, useCallback } from 'react';
import { HashRouter as Router, Switch, Route } from 'react-router-dom';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';
import {
  SnackbarProvider,
  PLACEMENT,
} from 'baseui/snackbar';

import AppContext from 'src/share/context';
import appReducer, { initialState, init } from 'src/share/reducer';
import { setLolVersion, updateItemMap } from 'src/share/actions';
import config from 'src/native/config';
import { getItemList, getLolVer } from 'src/service/data-source/lol-qq';
import LCUService from 'src/service/lcu';

import Footer from 'src/components/footer';
import Toolbar from 'src/components/toolbar';
import Home from 'src/modules/home';
import Import from 'src/modules/import';
import Settings from 'src/modules/settings';

import { ILcuUserAction } from 'src/typings/commonTypes';

const engine = new Styletron();
const GameTypes = [`pick`];

const findUserChampion = (cellId: number, actions: ILcuUserAction[][] = []) => {
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

  const checkTask = useRef<number>();
  const lcuInstance = useRef<LCUService>();

  const createCheckTask = useCallback((dir: string) => {
    checkTask.current = window.setInterval(async () => {
      try {
        let lolDir = dir;
        if (!lolDir) {
          lolDir = config.get(`lolDir`);
        }
        if (!lolDir) {
          throw new Error(`lol folder not selected.`);
        }

        if (!lcuInstance.current?.getAuthToken) {
          lcuInstance.current = new LCUService(lolDir);
        }
        const lcuIns = lcuInstance.current;
        await lcuIns.getAuthToken();
        if (!lcuIns.active) {
          throw new Error(`lcu not running.`);
        }

        const {
          actions = [],
          myTeam = [],
          localPlayerCellId: cellId,
        } = await lcuIns.getCurrentSession();

        const me = _find(myTeam, (i) => i.summonerId > 0 && i.cellId === cellId);
        const { championId: mChampionId } = me ?? { championId: 0 };
        let championId;

        const isRandomMode = !actions.length && myTeam.length > 0 && mChampionId > 0;
        const isVoteMode =
          mChampionId > 0 && myTeam.length > 0 && myTeam.every((i: { championId: number }) => i.championId === mChampionId);

        championId = findUserChampion(cellId, actions);
        if (!process.env.IS_DEV) {
          console.log(
            `isRandomMode: ${isRandomMode}, isVoteMode: ${isVoteMode}, My pick: ${cellId}`,
          );
        }

        if (isRandomMode || isVoteMode) {
          // special mode
          championId = me!.championId;
        }

        if (!championId) {
          throw new Error(`no matched champion.`);
        }

        console.log(`got champion id: `, championId);
        ipcRenderer.send(`show-popup`, {
          championId,
          position: null,
        });

        console.log(`show popup.`);
        return true;
      } catch (_err) {
        const doNothing = Boolean(process.env.IS_DEV || process.env.SHOW_POPUP_TRIGGER === `true`);
        if (doNothing) return;

        console.error(_err.message);
        ipcRenderer.send(`hide-popup`);
        return false;
      }
    }, 2000);
  }, []);

  const onDirChange = (lolDir: string) => {
    window.clearInterval(checkTask.current);
    createCheckTask(lolDir);
  };

  useEffect(() => {
    createCheckTask('');

    return () => {
      clearInterval(checkTask.current);
    };
  }, [createCheckTask]);

  useEffect(() => {
    const getVerAndItems = async () => {
      const v = await getLolVer();
      dispatch(setLolVersion(v));
      config.set(`lolVer`, v);

      const data = await getItemList();

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
        shell.openExternal(`https://github.com/cangzhang/champ-r/releases`);
      };
    });

    // ipcRenderer.on(`update-downloaded`, () => {});
  }, []);

  useEffect(() => {
    setTimeout(() => {
      ipcRenderer.send(`app-sha`, { sha: process.env.HEAD });
    }, 5 * 1000);
  }, []);

  return (
    <AppContext.Provider value={contextValue}>
      <StyletronProvider value={engine}>
        <BaseProvider theme={LightTheme}>
          <SnackbarProvider placement={PLACEMENT.bottom} overrides={{
            Root: {
              style: () => ({
                marginBottom: `2em`,
              }),
            },
          }}>
            <Router>
              <Toolbar/>
              <Switch>
                <Route exact path={'/'}>
                  <Home onDirChange={onDirChange}/>
                </Route>
                <Route path={`/import`}>
                  <Import/>
                </Route>
                <Route path={`/settings`}>
                  <Settings/>
                </Route>
              </Switch>
            </Router>
            <Footer/>
          </SnackbarProvider>
        </BaseProvider>
      </StyletronProvider>
    </AppContext.Provider>
  );
};

export default App;
