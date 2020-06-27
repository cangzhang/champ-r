/* eslint react-hooks/exhaustive-deps: 0 */
import s from './style.module.scss';

import _noop from 'lodash/noop';

import React, { useCallback, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';

import { PauseCircle, RefreshCw, CheckCircle, XCircle, Home } from 'react-feather';
import { useStyletron } from 'baseui';
import { toaster, ToasterContainer, PLACEMENT } from 'baseui/toast';
import { Button } from 'baseui/button';
import { Label1, Paragraph3 } from 'baseui/typography';
import { StatefulPopover, TRIGGER_TYPE } from 'baseui/popover';

import Sources from 'src/share/constants/sources';
import { prepareReimport, updateFetchingSource, importBuildFailed } from 'src/share/actions';
import { removeFolderContent } from 'src/share/file';
import OpGGImporter from 'src/service/data-source/op-gg';
import LolQQImporter from 'src/service/data-source/lol-qq';
import MbImporter from 'src/service/data-source/murderbridge';

import config from 'src/native/config';
import AppContext from 'src/share/context';
import WaitingList from 'src/components/waiting-list';

export default function Import() {
  const history = useHistory();
  const [, theme] = useStyletron();
  const [t] = useTranslation();

  const lolDir = config.get(`lolDir`);
  const lolVer = config.get(`lolVer`);

  const { store, dispatch } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancel] = useState([]);
  const [opggResult, setOpggResult] = useState({
    fulfilled: [],
    rejected: [],
  });

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
          toaster.positive(t(`removed outdated items`), null);
        });
    }

    const { itemMap } = store;
    let opggTask = _noop;
    let lolqqTask = _noop;
    let mbTask = _noop;

    if (selectedSources.includes(Sources.Opgg)) {
      const instance = new OpGGImporter(lolVer, lolDir, itemMap, dispatch);
      workers.current[Sources.Opgg] = instance;

      opggTask = () =>
        instance
          .import()
          .then((result) => {
            const { fulfilled, rejected } = result;
            if (!rejected.length) {
              toaster.positive(`[${Sources.Opgg}] ${t(`completed`)}`, null);
            }
            setOpggResult({
              fulfilled,
              rejected,
            });
          })
          .catch((err) => {
            if (err.message.includes(`Error: Cancel`)) {
              setCancel(cancelled.concat(Sources.Opgg));
              toaster.warning(`${t(`cancelled`)}: ${Sources.Opgg}`, null);
            } else {
              dispatch(importBuildFailed(Sources.Opgg));
              toaster.negative(`${t(`import failed`)}: ${Sources.Opgg}`, null);
              console.error(err);
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
            toaster.positive(`[${Sources.Lolqq}] ${t(`completed`)}`, null);
          })
          .catch((err) => {
            if (err.message.includes(`Error: Cancel`)) {
              setCancel(cancelled.concat(Sources.Lolqq));
              toaster.warning(`${t(`cancelled`)}: ${Sources.Lolqq}`, null);
            } else {
              dispatch(importBuildFailed(Sources.Lolqq));
              toaster.negative(`${t(`import failed`)}: ${Sources.Lolqq}`, null);
              console.error(err);
            }
          });
    }

    if (selectedSources.includes(Sources.MurderBridge)) {
      const instance = new MbImporter(lolDir, itemMap, dispatch);
      mbTask = () =>
        instance
          .import()
          .then(() => {
            toaster.positive(`[${Sources.MurderBridge}] ${t(`completed`)}`, null);
          })
          .catch((err) => {
            if (err.message.includes(`Error: Cancel`)) {
              setCancel(cancelled.concat(Sources.MurderBridge));
              toaster.warning(`${t(`cancelled`)}: ${Sources.Lolqq}`, null);
            } else {
              dispatch(importBuildFailed(Sources.MurderBridge));
              toaster.negative(`${t(`import failed`)}: ${Sources.Lolqq}`, null);
              console.error(err);
            }
          });
    }

    await cleanFolderTask();

    try {
      await Promise.all([opggTask(), lolqqTask(), mbTask()]);
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
  const hasFailed = store.importPage.fail.length > 0;

  const renderStatus = useCallback(() => {
    if (loading) {
      return <WaitingList />;
    }

    if (userCancelled) {
      return <PauseCircle size={128} color={theme.colors.contentWarning} />;
    }

    return (
      <>
        <CheckCircle size={128} color={theme.colors.contentPositive} />
        {opggResult.rejected.length > 0 && (
          <>
            <StatefulPopover
              content={
                <Paragraph3 accessibilityType={'tooltip'} triggerType={TRIGGER_TYPE.hover}>
                  {opggResult.rejected.map(([champion, position], idx) => (
                    <span key={idx}>
                      {champion}@{position}
                    </span>
                  ))}
                </Paragraph3>
              }>
              <Label1>
                {t(`rejected`)}: {opggResult.rejected.length}
              </Label1>
            </StatefulPopover>
          </>
        )}
      </>
    );
  }, [userCancelled, loading, hasFailed]);

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
