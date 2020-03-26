import s from './style.module.scss';

import _noop from 'lodash/noop';

import React, { useCallback, useContext, useEffect, useState, useRef } from 'react';
// import { useHistory } from 'react-router-dom';

import { toaster, ToasterContainer, PLACEMENT } from 'baseui/toast';
import { Button } from 'baseui/button';
import { Check } from 'baseui/icon';
import { useStyletron } from 'baseui';

import Sources from 'src/share/sources';
import { prepareReimport, updateFetchingSource } from 'src/share/actions';
import { removeFolderContent } from 'src/share/file';
import OpGGImporter from 'src/service/data-source/op-gg';
import fetchLolqq from 'src/service/data-source/lol-qq';

import config from 'src/native/config';
import AppContext from 'src/share/context';
import WaitingList from 'src/components/waiting-list';

export default function Import() {
  // const history = useHistory();
  const [css, theme] = useStyletron();

  const lolDir = config.get(`lolDir`);
  const lolVer = config.get(`lolVer`);

  const { store, dispatch } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  const workers = useRef({});

  const cancelImport = () => {
    const ins = Object.values(workers.current);
    ins.map(i => i.cancel());
    // history.push(`/`);
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
        });
    }

    if (selectedSources.includes(Sources.Lolqq)) {
      lolqqTask = () => fetchLolqq(lolDir, itemMap, dispatch)
        .then(() => {
          const content = '[101.QQ.COM] Completed';
          toaster.positive(content);
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
    importFromSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // todo: real stop
  return <div className={s.import}>
    {
      loading
        ? <WaitingList />
        : <Check
          size={128}
          title={`Done`}
          color={theme.colors.backgroundPositive}
          className={css({
            animation: `rr 1s linear infinite`,
            '@keyframes rr': {
              '100%': {
                transform: `rotate(360deg)`,
              },
            },
          })}
        />
    }

    <Button className={s.back} onClick={cancelImport}>{loading ? `STOP` : `BACK TO HOME`}</Button>

    <ToasterContainer
      autoHideDuration={1500}
      placement={PLACEMENT.bottom}
      overrides={{
        ToastBody: {
          style: () => ({
            backgroundColor: '#5383e8',
          }),
        },
      }}
    />
  </div>;
}
