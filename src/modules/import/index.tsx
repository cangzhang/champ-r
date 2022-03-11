/* eslint react-hooks/exhaustive-deps: 0 */
import s from './style.module.scss';

import _noop from 'lodash/noop';

import React, { useCallback, useContext, useEffect, useState, useRef, useMemo } from 'react';
import { useHistory } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import cn from 'classnames';

import { PauseCircle, RefreshCw, CheckCircle, XCircle, Home } from 'react-feather';
import { useStyletron } from 'baseui';
import { toaster, ToasterContainer, PLACEMENT } from 'baseui/toast';
import { Button } from 'baseui/button';

import { ISourceItem, SourceQQ } from 'src/share/constants/sources';
import {
  prepareReimport,
  updateFetchingSource,
  importBuildFailed,
  importBuildSucceed,
} from 'src/share/actions';
import LolQQImporter from 'src/service/data-source/lol-qq';
import CdnService from 'src/service/data-source/cdn-service';

import AppContext from 'src/share/context';
import WaitingList from 'src/components/waiting-list';
import SourceProto from 'src/service/data-source/source-proto';

export default function Import() {
  const history = useHistory();
  const [, theme] = useStyletron();
  const [t] = useTranslation();
  const lolDir = window.bridge.appConfig.get(`lolDir`);
  const sourceList: ISourceItem[] = window.bridge.appConfig.get(`sourceList`);

  const { store, dispatch } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancel] = useState<string[]>([]);

  const workers = useRef<{
    [key: string]: SourceProto;
  }>({});

  const importFromSources = async () => {
    const { selectedSources, keepOld, fetched } = store;

    setLoading(true);
    if (fetched.length) {
      dispatch(prepareReimport());
    }
    dispatch(updateFetchingSource(selectedSources));

    if (!keepOld) {
      await Promise.all([
        window.bridge.file.removeFolderContent(`${lolDir}/Game/Config/Champions`),
        window.bridge.file.removeFolderContent(`${lolDir}/Config/Champions`),
      ]);
      toaster.positive(t(`removed outdated items`), {});
    }

    const { itemMap } = store;
    let lolqqTask = _noop;

    if (selectedSources.includes(SourceQQ.label)) {
      const idx = sourceList.findIndex((i) => i.label === SourceQQ.label);
      const instance = new LolQQImporter(lolDir, itemMap, dispatch);
      workers.current[SourceQQ.label] = instance;

      lolqqTask = () =>
        instance
          .import(idx + 1)
          .then(() => {
            toaster.positive(`[${SourceQQ.label.toUpperCase()}] ${t(`completed`)}`, {});
            dispatch(importBuildSucceed(SourceQQ.label));
          })
          .catch((err) => {
            if (err.message.includes(`Error: Cancel`)) {
              setCancel(cancelled.concat(SourceQQ.label));
              toaster.warning(`${t(`cancelled`)}: ${SourceQQ.label}`, {});
            } else {
              dispatch(importBuildFailed(SourceQQ.label));
              toaster.negative(`${t(`import failed`)}: ${SourceQQ.label}`, {});
              console.error(err);
            }
          });
    }

    const tasks = sourceList.map((p, index) => {
      if (p.value === SourceQQ.value) {
        return Promise.resolve();
      }
      // exclude the `qq` source
      if (!selectedSources.includes(p.label)) {
        return Promise.resolve();
      }

      const instance = new CdnService(p.value, dispatch);
      workers.current[p.label] = instance;
      return instance
        .importFromCdn(lolDir, index)
        .then((result) => {
          const { rejected } = result;
          if (!rejected.length) {
            toaster.positive(`[${p.label.toUpperCase()}] ${t(`completed`)}`, {});
            dispatch(importBuildSucceed(p.label));
          }
        })
        .catch((err) => {
          if (err.message.includes(`Error: Cancel`)) {
            setCancel(cancelled.concat(p.label));
            toaster.warning(`${t(`cancelled`)}: ${p.label}`, {});
          } else {
            dispatch(importBuildFailed(p.label));
            toaster.negative(`${t(`import failed`)}: ${p.label}`, {});
            console.error(err);
          }
        });
    });

    try {
      await Promise.all([...tasks, lolqqTask()]);
    } finally {
      setLoading(false);
    }
  };

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

  const renderStatus = () => {
    if (loading) {
      return (
        <>
          <WaitingList />
          {/* @ts-ignore */}
          <Button className={s.back} onClick={stop}>
            {t(`stop`)}
          </Button>
        </>
      );
    }

    if (userCancelled) {
      return (
        <>
          <PauseCircle size={128} color={theme.colors.contentWarning} />
          <Button
            // @ts-ignore
            className={s.back}
            /* @ts-ignore */
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
            // @ts-ignore
            className={s.back}
            // @ts-ignore
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

    const failed = store.importPage.fail.length > 0;

    // @ts-ignore
    return (
      <>
        {!failed && <CheckCircle size={128} color={theme.colors.contentPositive} />}
        {failed && (
          <div className={s.failed}>
            {t(`rejected`)}: {store.importPage.fail.join(`, `)}
          </div>
        )}
        {/* @ts-ignore */}
        <Button className={s.back} onClick={backToHome} startEnhancer={<Home title={`Home`} />}>
          {t(`back to home`)}
        </Button>
      </>
    );
  };

  const backToHome = useCallback(() => history.replace(`/`), []);

  useEffect(() => {
    if (!store.itemMap && !process.env.IS_DEV) {
      return history.replace('/');
    }

    importFromSources();
  }, []);

  return (
    <div className={cn(s.import, loading && s.ing)}>
      {renderStatus()}
      <ToasterContainer autoHideDuration={1500} placement={PLACEMENT.bottom} />
    </div>
  );
}
