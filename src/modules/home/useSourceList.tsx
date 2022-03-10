import { useCallback, useEffect, useRef, useState } from 'react';
import http from 'src/service/http';
import { SourceQQ, ISourceItem } from 'src/share/constants/sources';
import { NPM_MIRROR, CDN_PREFIX } from 'src/service/data-source/cdn-service';

const CHECK_INTV = 30 * 60 * 1000;
const VersionUrl = `${NPM_MIRROR}/@champ-r/source-list/latest`;
const getLatestList = (version: string) => `${CDN_PREFIX}/source-list@${version}/index.json`;

const LAST_TIME_LIST = window.bridge.appConfig.get(`sourceList`);

export function useSourceList() {
  const [loading, setLoading] = useState(true);
  const [sourceList, setSourceList] = useState<ISourceItem[]>(LAST_TIME_LIST);

  const worker = useRef<number>();

  const setupTask = useCallback(async () => {
    try {
      const data: any = await http.get(VersionUrl);
      const version = data[`dist-tags`][`latest`];
      const url = getLatestList(version);

      const rawList: ISourceItem[] = await http.get(url);
      let list = [SourceQQ, ...rawList];
      const newItems = rawList.filter((i) => sourceList.every((j) => j.value !== i.value));
      const deletedItems = sourceList
        .filter((i) => i.value !== SourceQQ.value)
        .filter((i) => rawList.every((j) => j.value !== i.value));
      list = list.filter((i) => deletedItems.filter((j) => j.value !== i.value)).concat(newItems);

      setSourceList(list);
    } catch (_) {}
  }, [sourceList]);

  useEffect(() => {
    setupTask().finally(() => {
      setLoading(false);
    });

    worker.current = window.setInterval(() => {
      setupTask();
    }, CHECK_INTV);

    return () => {
      clearInterval(worker.current);
    };
  }, [setupTask]);

  useEffect(() => {
    window.bridge.appConfig.set(`sourceList`, sourceList);
  }, [sourceList]);

  return {
    loading,
    sourceList,
    setSourceList,
  };
}
