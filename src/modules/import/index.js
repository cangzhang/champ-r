import React, { useCallback, useContext, useEffect } from 'react';
import { toaster, ToasterContainer, PLACEMENT } from 'baseui/toast';

import Sources from 'src/share/sources';
import { prepareReimport, updateFetchingSource } from 'src/share/actions';
import { removeFolderContent } from 'src/share/file';
import fetchOpgg from 'src/service/data-source/op-gg';
import fetchLolqq from 'src/service/data-source/lol-qq';

import config from 'src/native/config';
import AppContext from 'src/share/context';
import WaitingList from 'src/components/waiting-list';

export default function Importing() {
  const lolDir = config.get(`lolDir`);
  const lolVer = config.get(`lolVer`);

  const { store, dispatch } = useContext(AppContext);

  const importFromSources = useCallback(async () => {
    const { selectedSources, keepOld, fetched } = store;

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

    let opggTask = Promise.resolve();
    let lolqqTask = Promise.resolve();

    if (selectedSources.includes(Sources.Opgg)) {
      opggTask = () => fetchOpgg(lolVer, lolDir, itemMap, dispatch)
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
    await Promise.all([opggTask(), lolqqTask()]);
  }, [store]);


  useEffect(() => {
    importFromSources();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return <div>
    <WaitingList />

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
