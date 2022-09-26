import React, { useReducer, useMemo, useEffect } from 'react';
import { HashRouter as Router, Routes, Route } from 'react-router-dom';
import mitt from 'mitt';

import { Client as Styletron } from 'styletron-engine-atomic';
import { Provider as StyletronProvider } from 'styletron-react';
import { LightTheme, BaseProvider } from 'baseui';
import { SnackbarProvider, PLACEMENT } from 'baseui/snackbar';

import AppContext from 'src/share/context';
import appReducer, { initialState, init } from 'src/share/reducer';
import { setLolVersion, updateItemMap } from 'src/share/actions';
import { getItemList, getLolVer } from 'src/service/data-source/lol-qq';

import Footer from 'src/components/footer';
import Toolbar from 'src/components/toolbar';
import Home from 'src/modules/home';
import { Import } from 'src/modules/import';
import Settings from 'src/modules/settings';

const engine = new Styletron();
const emitter = mitt();

const App = () => {
  const [store, dispatch] = useReducer(appReducer, initialState, init);

  useEffect(() => {
    const getVerAndItems = async () => {
      const v = await getLolVer();
      dispatch(setLolVersion(v));
      window.bridge.appConfig.set(`lolVer`, v);

      const data = await getItemList();

      dispatch(
        updateItemMap({
          ...data,
        }),
      );
    };

    getVerAndItems();

    window.bridge.on(`update-available`, (info: any) => {
      const notify = new Notification(`New version available: ${info.version}`);

      notify.onclick = () => {
        window.shell.openExternal(`https://github.com/cangzhang/champ-r/releases`);
      };
    });
  }, []);

  useEffect(() => {
    window.bridge.sendMessage(`request-for-auth-config`);
  }, []);

  const value = useMemo(() => ({ store, dispatch, emitter }), [store, dispatch]);

  return (
    <AppContext.Provider value={value}>
      <StyletronProvider value={engine}>
        <BaseProvider theme={LightTheme}>
          <SnackbarProvider
            placement={PLACEMENT.bottom}
            overrides={{
              Root: {
                style: () => ({
                  marginBottom: `2em`,
                }),
              },
            }}>
            <Router>
              <Toolbar/>
              <Routes>
                <Route path={`/import`} element={<Import/>}/>
                <Route path={`/settings`} element={<Settings/>}/>
                <Route path={'/'} element={<Home/>}/>
              </Routes>
            </Router>
            <Footer/>
          </SnackbarProvider>
        </BaseProvider>
      </StyletronProvider>
    </AppContext.Provider>
  );
};

export default App;
