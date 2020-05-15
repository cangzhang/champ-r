/* eslint react-hooks/exhaustive-deps: 0 */
import s from './style.module.scss';

import _noop from 'lodash/noop';

import React, { useCallback, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { useStyletron } from 'baseui';
import { toaster, ToasterContainer, PLACEMENT } from 'baseui/toast';
import { Button } from 'baseui/button';
import { PauseCircle, RefreshCw, CheckCircle, XCircle, Home } from 'react-feather';

import Sources from 'src/share/constants/sources';
import { prepareReimport, updateFetchingSource } from 'src/share/actions';
import { removeFolderContent } from 'src/share/file';
import OpGGImporter from 'src/service/data-source/op-gg';
import LolQQImporter from 'src/service/data-source/lol-qq';

import config from 'src/native/config';
import AppContext from 'src/share/context';
import WaitingList from 'src/components/waiting-list';
import useGA from 'src/components/use-ga';

export default function Import() {
  const history = useHistory();
  const [, theme] = useStyletron();
  const [t] = useTranslation();

  const lolDir = config.get(`lolDir`);
  const lolVer = config.get(`lolVer`);

  const { store, dispatch } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancel] = useState([]);

  const workers = useRef({});

  const importFromSources = useCallback(async () => {
    const { selectedSources, keepOld, fetched } = store;

    setLoading(true);
    if (fetched.length) {
      dispatch(prepareReimport());
    }
    dispatch(updateFetchingSource(selectedSources));

    let cleanFolderTask = () => Promise.resolve();
    if (!keepOld) {
      cleanFolderTask = () =>
        removeFolderContent(`${lolDir}/Game/Config/Champions`).then(() => {
          toaster.positive(t(`removed outdated items`));
        });
    }

    const { itemMap } = store;
    let opggTask = _noop;
    let lolqqTask = _noop;

    if (selectedSources.includes(Sources.Opgg)) {
      const instance = new OpGGImporter(lolVer, lolDir, itemMap, dispatch);
      workers.current[Sources.Opgg] = instance;

      opggTask = () =>
        instance
          .import()
          .then(() => {
            toaster.positive(`[OP.GG] ${t(`completed`)}`);
          })
          .catch((err) => {
            if (err.message === `Error: Cancel`) {
              setCancel(cancelled.concat(Sources.Opgg));
              toaster.negative(`${t(`cancelled`)}: ${Sources.Opgg}`);
            }
          });
    }

    if (selectedSources.includes(Sources.Lolqq)) {
      const instance = new LolQQImporter(lolDir, itemMap, dispatch);
      workers.current[Sources.Lolqq] = instance;

      lolqqTask = () =>
        instance
          .import()
          .then(() => {
            toaster.positive(`[lol.QQ.COM] ${t(`completed`)}`);
          })
          .catch((err) => {
            if (err.message === `Error: Cancel`) {
              setCancel(cancelled.concat(Sources.Lolqq));
              toaster.negative(`${t(`cancelled`)}: ${Sources.Lolqq}`);
            }
          });
    }

    await cleanFolderTask();

    try {
      await Promise.all([opggTask(), lolqqTask()]);
    } finally {
      setLoading(false);
    }
  }, [store]);

  useEffect(() => {
    if (!store.itemMap) {
      return history.replace('/');
    }

    importFromSources();
  }, []);

  useGA({ page: `/import` });

  const stop = () => {
    setLoading(false);
    setCancel(Object.keys(workers.current));

    const ins = Object.values(workers.current);
    ins.map((i) => i.cancel());
  };

  const restart = () => {
    importFromSources();
  };

  const userCancelled = useMemo(() => cancelled.length > 0, [cancelled]);

  const renderStatus = useCallback(() => {
    if (loading) {
      return <WaitingList />;
    }

    if (userCancelled) {
      return <PauseCircle size={128} color={theme.colors.contentWarning} />;
    }

    return <CheckCircle size={128} color={theme.colors.contentPositive} />;
  }, [userCancelled, loading]);

  const backToHome = useCallback(() => history.replace(`/`), []);

  const renderControl = useCallback(() => {
    if (loading) {
      return (
        <Button className={s.back} onClick={stop}>
          {t(`stop`)}
        </Button>
      );
    }

    if (userCancelled) {
      return (
        <>
          <Button
            className={s.back}
            startEnhancer={<RefreshCw title={'Restart'} />}
            onClick={restart}
            overrides={{
              BaseButton: {
                style: ({ $theme }) => {
                  return {
                    backgroundColor: $theme.colors.contentPositive,
                  };
                },
              },
            }}>
            {t(`restart`)}
          </Button>
          <Button
            className={s.back}
            startEnhancer={<XCircle title={'Homepage'} />}
            onClick={backToHome}
            overrides={{
              BaseButton: {
                style: ({ $theme }) => {
                  return {
                    backgroundColor: $theme.colors.negative,
                  };
                },
              },
            }}>
            {t(`cancel`)}
          </Button>
        </>
      );
    }

    return (
      <Button className={s.back} onClick={backToHome} startEnhancer={<Home title={`Home`} />}>
        {t(`back to home`)}
      </Button>
    );
  }, [userCancelled, loading]);

  return (
    <div className={s.import}>
      {renderStatus()}
      {renderControl()}

      <ToasterContainer autoHideDuration={1500} placement={PLACEMENT.bottom} />
    </div>
  );
}
