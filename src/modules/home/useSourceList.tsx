import { useEffect, useRef, useState } from 'react';
import http from 'src/service/http';
import { SourceQQ, ISourceItem } from 'src/share/constants/sources';
import { NPM_MIRROR } from 'src/service/data-source/cdn-service';

const CHECK_INTV = 60 * 60 * 1000;
const VersionUrl = `${NPM_MIRROR}/@champ-r/source-list/latest`;

function mergeList(sourceList: ISourceItem[], rawList: ISourceItem[]) {
  const newItems = rawList.filter((i) => sourceList.every((j) => j.value !== i.value));
  const deletedItems = sourceList
    .filter((i) => i.value !== SourceQQ.value)
    .filter((i) => rawList.every((j) => j.value !== i.value));
  const list = sourceList
    .filter((i) => deletedItems.every((j) => j.value !== i.value))
    .concat(newItems);
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
      const data: any = await http.get(`${VersionUrl}?_${+Date.now()}`);
      let list = mergeList(sourceList, [SourceQQ, ...data.sources]);
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
  }, []); // eslint-disable-line

  useEffect(() => {
    window.bridge.appConfig.set(`sourceList`, sourceList);
  }, [sourceList]);

  return {
    loading,
    sourceList,
    setSourceList,
  };
}
