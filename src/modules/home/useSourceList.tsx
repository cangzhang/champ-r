import { useEffect, useRef, useState } from 'react';
import http from 'src/service/http';
import { SourceQQ, ISourceItem } from 'src/share/constants/sources';
import { NPM_MIRROR, CDN_PREFIX } from 'src/service/data-source/cdn-service';

const CHECK_INTV = 30 * 60 * 1000;
const VersionUrl = `${NPM_MIRROR}/@champ-r/source-list/latest`;
const getLatestList = (version: string) => `${CDN_PREFIX}/source-list@${version}/index.json`;

function mergeList(sourceList: ISourceItem[], rawList: ISourceItem[]) {
  let list: ISourceItem[] = [];
  const newItems = rawList.filter((i) => sourceList.every((j) => j.value !== i.value));
  const deletedItems = sourceList
    .filter((i) => i.value !== SourceQQ.value)
    .filter((i) => rawList.every((j) => j.value !== i.value));
  list = list.filter((i) => deletedItems.filter((j) => j.value !== i.value)).concat(newItems);
  return list;
}

export function useSourceList() {
  const [loading, setLoading] = useState(true);
  const [sourceList, setSourceList] = useState<ISourceItem[]>(
    window.bridge.appConfig.get(`sourceList`),
  );

  const worker = useRef<number>();

  const setupTask = async () => {
    try {
      const data: { version: string } = await http.get(VersionUrl);
      const version = data[`version`];
      const url = getLatestList(version);

      const rawList: ISourceItem[] = await http.get(url);
      let list = mergeList(sourceList, [SourceQQ, ...rawList]);

      setSourceList(list);
    } catch (err) {
      console.error(err);
    }
  };

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
  }, []);

  useEffect(() => {
    window.bridge.appConfig.set(`sourceList`, sourceList);
  }, [sourceList]);

  return {
    loading,
    sourceList,
    setSourceList,
  };
}
