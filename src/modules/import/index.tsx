import s from './style.module.scss';

import _noop from 'lodash/noop';
import React, { useContext, useState, useRef, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import cn from 'classnames';
import { toast, Toaster } from 'react-hot-toast';
import { Button } from '@nextui-org/react';

import { ISourceItem, SourceQQ } from 'src/share/constants/sources';
import LolQQImporter from 'src/service/data-source/lol-qq';
import AppContext from 'src/share/context';
import SourceProto from 'src/service/data-source/source-proto';

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

    function showToast({ finished, source, error }: { finished: boolean, source: string, error: boolean }) {
      if (finished) {
        toast.success(`[${source.toUpperCase()}] Applied successfully`);
        setResult(p => ({
          ...p,
          [source]: {
            finished,
            error,
          },
        }));
      }
      if (error) {
        toast.success(`[${source.toUpperCase()}] Something went wrong`);
      }
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
      if (ids.current.includes(ev.id)) {
        return;
      }

      ids.current.push(ev.id);
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

      <Button className={s.back} flat color="secondary" auto onClick={() => navigate(`/`)}>{t(`back to home`)}</Button>

      <Toaster
        position="bottom-center"
        reverseOrder={false}
      />
    </div>
  );
}
