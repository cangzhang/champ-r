import { useEffect, useRef, useState } from 'react';
import http from 'src/service/http';
import { SourceQQ, ISourceItem, DefaultSourceList } from 'src/share/constants/sources';

const CHECK_INTV = 5 * 60 * 1000;
const VersionUrl = `https://registry.npm.taobao.org/@champ-r/source-list`;
const DevVersionUrl = `https://registry.npm.taobao.org/@champ-r/source-list.dev`;
const getLatestList = (version: string, isDev: boolean) =>
  `https://cdn.jsdelivr.net/npm/@champ-r/source-list${
    isDev ? '.dev' : ''
  }@${version}/index.json?_${Date.now()}`;

const ENABLED_TEST_CHANNEL = Boolean(process.env.IS_DEV || process.env.ENABLED_TEST_CHANNEL);

export default function UseSourceList() {
  const [loading, setLoading] = useState(true);
  const [sourceList, setSourceList] = useState<ISourceItem[]>(DefaultSourceList);

  const worker = useRef<number>();

  const setupTask = async () => {
    try {
      const data: any = await http.get(
        (ENABLED_TEST_CHANNEL ? DevVersionUrl : VersionUrl) + `?_${Date.now()}`,
      );
      const version = data[`dist-tags`][`latest`];
      const url = getLatestList(version, ENABLED_TEST_CHANNEL);
      const rawList: ISourceItem[] = await http.get(url);
      const list = [SourceQQ, ...rawList];
      window.bridge.appConfig.set(`sourceList`, list);
      setSourceList(list);
    } catch (_) {}
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

  return {
    loading,
    sourceList,
  };
}
