import s from './style.module.scss';

import _noop from 'lodash/noop';

import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
import { useHistory } from 'react-router-dom';

import { toaster, ToasterContainer, PLACEMENT } from 'baseui/toast';
import { Button } from 'baseui/button';
import { ArrowUp } from 'baseui/icon';

import Sources from 'src/share/sources';
import { prepareReimport, updateFetchingSource } from 'src/share/actions';
import { removeFolderContent } from 'src/share/file';
import OpGGImporter from 'src/service/data-source/op-gg';
import LolQQImporter from 'src/service/data-source/lol-qq';

import config from 'src/native/config';
import AppContext from 'src/share/context';
import WaitingList from 'src/components/waiting-list';

export default function Import() {
  const history = useHistory();

  const lolDir = config.get(`lolDir`);
  const lolVer = config.get(`lolVer`);

  const { store, dispatch } = useContext(AppContext);
  const [loading, setLoading] = useState(false);
  const [cancelled, setCancel] = useState([]);

  const workers = useRef({});

  const cancelImport = () => {
    setLoading(false);

    const ins = Object.values(workers.current);
    ins.map(i => i.cancel());
  };

  const importFromSources = useCallback(async () => {
    const { selectedSources, keepOld, fetched } = store;

    setLoading(true);
    if (fetched.length) {
      dispatch(prepareReimport());
    }

    dispatch(updateFetchingSource(selectedSources));

    let cleanFolderTask = () => Promise.resolve();
    if (!keepOld) {
      cleanFolderTask = () => removeFolderContent(`${lolDir}/Game/Config/Champions`).then(() => {
        toaster.positive('Removed outdated items.');
      });
    }

    const { itemMap } = store;

    let opggTask = _noop;
    let lolqqTask = _noop;

    if (selectedSources.includes(Sources.Opgg)) {
      const instance = new OpGGImporter(lolVer, lolDir, itemMap, dispatch);
      workers.current[Sources.Opgg] = instance;

      opggTask = () => instance.import()
        .then(() => {
          const content = '[OP.GG] Completed';
          toaster.positive(content);
        })
        .catch(err => {
          if (err.message === `Error: Cancel`) {
            setCancel(cancelled.concat(Sources.Opgg));
            toaster.negative(`Cancelled: ${Sources.Opgg}`);
          }
        });
    }

    if (selectedSources.includes(Sources.Lolqq)) {
      const instance = new LolQQImporter(lolDir, itemMap, dispatch);
      workers.current[Sources.Lolqq] = instance;

      lolqqTask = () => instance.import()
        .then(() => {
          const content = '[101.QQ.COM] Completed';
          toaster.positive(content);
        })
        .catch(err => {
          if (err.message === `Error: Cancel`) {
            setCancel(cancelled.concat(Sources.Lolqq));
            toaster.negative(`Cancelled: ${Sources.Lolqq}`);
          }
        });
    }

    await cleanFolderTask();
    try {
      await Promise.all([opggTask(), lolqqTask()]);
    } finally {
      setLoading(false);
    }

    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [store]);

  useEffect(() => {
    if (!store.itemMap) {
      return history.replace('/');
    }

    importFromSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const userCancelled = cancelled.length > 0;

  const renderControl = () => {
    if (loading) {
      return <Button className={s.back} onClick={cancelImport}>Stop</Button>;
    }

    if (userCancelled) {
      return <>
        <Button
          className={s.back}
          startEnhancer={() => <ArrowUp title={'Restart'} />}
          overrides={{
            BaseButton: {
              style: ({ $theme }) => {
                return {
                  backgroundColor: $theme.colors.backgroundLightAccent,
                };
              },
            },
          }}
        >
          Restart
        </Button>
      </>;
    }

    return <Button className={s.back} onClick={() => history.replace(`/`)}>Return to home</Button>;
  };

  return <div className={s.import}>
    {loading && <WaitingList />}

    {renderControl()}

    <ToasterContainer
      autoHideDuration={1500}
      placement={PLACEMENT.bottom}
      // overrides={{
      //   ToastBody: {
      //     style: () => ({
      //       backgroundColor: '#5383e8',
      //     }),
      //   },
      // }}
    />
  </div>;
};
