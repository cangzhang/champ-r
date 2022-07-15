/* eslint react-hooks/exhaustive-deps: 0 */
import s from './style.module.scss';

import _noop from 'lodash/noop';

import React, { useContext, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import cn from 'classnames';

// import { PauseCircle, RefreshCw, CheckCircle, XCircle, Home } from 'react-feather';
// import { useStyletron } from 'baseui';
import { toaster, ToasterContainer, PLACEMENT } from 'baseui/toast';
// import { Button } from 'baseui/button';

import { ISourceItem, SourceQQ } from 'src/share/constants/sources';
import {
  prepareReimport,
  updateFetchingSource,
  importBuildFailed,
  importBuildSucceed,
} from 'src/share/actions';
import LolQQImporter from 'src/service/data-source/lol-qq';

import AppContext from 'src/share/context';
// import WaitingList from 'src/components/waiting-list';
import SourceProto from 'src/service/data-source/source-proto';

export function Import() {
  // const navigate = useNavigate();
  // const [, theme] = useStyletron();
  const [t] = useTranslation();
  const lolDir = window.bridge.appConfig.get(`lolDir`);
  const sourceList: ISourceItem[] = window.bridge.appConfig.get(`sourceList`);

  const [msgs, setMsgs] = useState<string[]>([]);
  let [searchParams] = useSearchParams();

  const { store, dispatch } = useContext(AppContext);
  const [loading, setLoading] = useState(false);

  const workers = useRef<{
    [key: string]: SourceProto;
  }>({});

  const importFromSources = async () => {
    let sources = (searchParams.get(`sources`) ?? ``).split(`,`) ?? [];
    let keepOld = searchParams.get(`keepOld`);

    if (!sources) {
      return;
    }

    console.log(sources);
    return;

    setLoading(true);
    if (!keepOld) {
      await Promise.all([
        window.bridge.file.removeFolderContent(`${lolDir}/Game/Config/Champions`),
        window.bridge.file.removeFolderContent(`${lolDir}/Config/Champions`),
      ]);
      toaster.positive(t(`removed outdated items`), {});
    }

    const { itemMap } = store;
    let lolqqTask = _noop;

    if (sources.includes(SourceQQ.value)) {
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
      if (!sources.includes(p.value)) {
        return Promise.resolve();
      }

      window.bridge.sendMessage(`PrepareSourceData`, p.value);
      return Promise.resolve();
    });

    try {
      await Promise.all([...tasks, lolqqTask()]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    window.bridge.on(`apply_builds_process`, (data: any) => {
      setMsgs(p => [...p, data.msg]);
    });
  }, []);

  useEffect(() => {
    console.log(searchParams.get(`sources`));
    importFromSources();
  }, [searchParams]);

  return (
    <div className={cn(s.import, loading && s.ing)}>
      <div>
        {msgs.map(s => (
          <div>{s}</div>
        ))}
      </div>
      <ToasterContainer autoHideDuration={1500} placement={PLACEMENT.bottom}/>
    </div>
  );
}
