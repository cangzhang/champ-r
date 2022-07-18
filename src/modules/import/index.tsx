import s from './style.module.scss';

import noop from 'lodash/noop';
import React, { useContext, useState, useRef, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import cn from 'classnames';
import { toast, Toaster } from 'react-hot-toast';
import { Button, Loading, Spacer } from '@nextui-org/react';

import { ISourceItem, SourceQQ } from 'src/share/constants/sources';
import LolQQImporter from 'src/service/data-source/lol-qq';
import AppContext from 'src/share/context';
import SourceProto from 'src/service/data-source/source-proto';
import { createIpcPromise } from 'src/service/ipc';

export function Import() {
  const navigate = useNavigate();
  const [t] = useTranslation();
  const lolDir = window.bridge.appConfig.get(`lolDir`);
  const sourceList: ISourceItem[] = window.bridge.appConfig.get(`sourceList`);
  const ids = useRef<string[]>([]);
  const { store, emitter } = useContext(AppContext);
  let [searchParams] = useSearchParams();

  const [messages, setMessages] = useState<string[]>([]);
  const [result, setResult] = useState<{ [k: string]: { finished: boolean; error: boolean; } }>({});

  const workers = useRef<{
    [key: string]: SourceProto;
  }>({});

  let sources = (searchParams.get(`sources`) ?? ``).split(`,`) ?? [];

  const importFromSources = useCallback(async () => {
    let sources = (searchParams.get(`sources`) ?? ``).split(`,`) ?? [];
    let keepOld = searchParams.get(`keepOld`) === `true`;

    if (!sources?.length) {
      return;
    }
    setResult({});

    if (!keepOld) {
      await createIpcPromise(`EmptyBuildsFolder`);
      toast.success(t(`removed outdated items`), {
        duration: 3000,
      });
    }

    const { itemMap } = store;
    let lolqqTask = noop;

    if (sources.includes(SourceQQ.value)) {
      const idx = sourceList.findIndex((i) => i.value === SourceQQ.value);
      const instance = new LolQQImporter(lolDir, itemMap, emitter);
      workers.current[SourceQQ.value] = instance;

      lolqqTask = () =>
        instance
          .import(idx + 1);
    }

    let tasks = sources.filter(i => i !== SourceQQ.value).map(i => {
      window.bridge.sendMessage(`ApplySourceBuilds`, i);
      return Promise.resolve();
    });

    try {
      await Promise.all([...tasks, lolqqTask()]);
    } finally {
    }
  }, [searchParams, lolDir]); // eslint-disable-line

  useEffect(() => {
    function updateMessage(msg: string) {
      setMessages(p => [msg, ...p]);
    }
    function showToast({ finished, source, error }: { finished: boolean, source: string, error: boolean }) {
      if (finished) {
        let text = `[${source.toUpperCase()}] Applied successfully`
        toast.success(text, { id: text, duration: 3000 });
        setResult(p => ({
          ...p,
          [source]: {
            finished,
            error,
          },
        }));
      }
      if (error) {
        toast.error(`[${source.toUpperCase()}] Something went wrong`, {
          duration: 3000,
        });
      }
    }
    function handler(ev: any) {
      if (ids.current.includes(ev.id)) {
        return;
      }

      ids.current.push(ev.id);
      updateMessage(ev.data.msg);
      showToast(ev.data);
    }

    window.bridge.on(`apply_builds_process`, handler);
    emitter.on(`apply_builds_process`, handler);

    return () => {
      emitter.off(`apply_builds_process`, handler);
      window.bridge.removeListener(`apply_builds_process`, handler);
    };
  }, [emitter]); // eslint-disable-line

  useEffect(() => {
    importFromSources();
  }, [importFromSources]); // eslint-disable-line

  const keys = Object.keys(result);
  let allDone = sources.length > 0
    && keys.length === sources.length
    && keys.every(k => sources.includes(k))
    && keys.every(k => result[k].finished || result[k].error);

  return (
    <div className={cn(s.import)}>
      {!allDone && <>
        <Loading type="points" size="lg"/>
        <Spacer/>
      </>}
      {allDone && <i className={cn(`bx bxs-flag-checkered bx-lg bx-tada`, s.done)} />}
      <div className={s.progress}>
        {messages.map((s, idx) => (
          <div key={idx}>{s}</div>
        ))}
      </div>

      <Button className={s.back} flat color="secondary" auto onPress={() => navigate(`/`)}>{t(`back to home`)}</Button>

      <Toaster
        position="bottom-center"
        reverseOrder={false}
      />
    </div>
  );
}
