/* eslint react-hooks/exhaustive-deps: 0 */
import s from './style.module.scss';

import _noop from 'lodash/noop';

import React, { useContext, useState, useRef, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import cn from 'classnames';
import { toast, Toaster } from 'react-hot-toast';

// import { PauseCircle, RefreshCw, CheckCircle, XCircle, Home } from 'react-feather';
// import { useStyletron } from 'baseui';
// import { toaster, ToasterContainer, PLACEMENT } from 'baseui/toast';
// import { Button } from 'baseui/button';

import { ISourceItem, SourceQQ } from 'src/share/constants/sources';
// import {
//   prepareReimport,
//   updateFetchingSource,
//   importBuildFailed,
//   importBuildSucceed,
// } from 'src/share/actions';
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
  const ids = useRef<string[]>([]);
  const { store, emitter } = useContext(AppContext);

  const [messages, setMessages] = useState<string[]>([]);
  let [searchParams] = useSearchParams();

  const workers = useRef<{
    [key: string]: SourceProto;
  }>({});

  const importFromSources = async () => {
    let sources = (searchParams.get(`sources`) ?? ``).split(`,`) ?? [];
    let keepOld = searchParams.get(`keepOld`);

    if (!sources) {
      return;
    }

    if (!keepOld) {
      await Promise.all([
        window.bridge.file.removeFolderContent(`${lolDir}/Game/Config/Champions`),
        window.bridge.file.removeFolderContent(`${lolDir}/Config/Champions`),
      ]);
      toast.success(t(`removed outdated items`));
    }

    const { itemMap } = store;
    let lolqqTask = _noop;

    if (sources.includes(SourceQQ.value)) {
      const idx = sourceList.findIndex((i) => i.value === SourceQQ.value);
      const instance = new LolQQImporter(lolDir, itemMap, emitter);
      workers.current[SourceQQ.value] = instance;

      lolqqTask = () =>
        instance
          .import(idx + 1);
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
    }
  };

  useEffect(() => {
    function updateMessage(msg: string) {
      setMessages(p => [...p, msg]);
    }

    function showToast({ finished, source }: { finished: boolean, source: string }) {
      if (!finished) return;

      toast.success(`[${source.toUpperCase()}] Applied`);
    }

    window.bridge.on(`apply_builds_process`, (ev: any) => {
      if (ids.current.includes(ev.id)) {
        return;
      }

      ids.current.push(ev.id);
      updateMessage(ev.data.msg);
      showToast(ev.data);
    });
    emitter.on(`apply_builds_process`, (ev) => {
      updateMessage(ev.data.msg);
      showToast(ev.data);
    });

    return () => {
      emitter.off(`apply_builds_process`, updateMessage);
    };
  }, []);

  useEffect(() => {
    importFromSources();
  }, [searchParams]);

  return (
    <div className={cn(s.import)}>
      <div className={s.progress}>
        {messages.map((s, idx) => (
          <div key={idx}>{s}</div>
        ))}
      </div>

      <Toaster
        position="bottom-center"
        reverseOrder={false}
      />
    </div>
  );
}
