import { useEffect, useRef, useState } from 'react';
import http from 'src/service/http';
import config from 'src/native/config';
import { SourceQQ, ISourceItem, DefaultSourceList } from 'src/share/constants/sources';

const TEN_MIN = 10 * 60 * 1000;
const VersionUrl = `https://registry.npm.taobao.org/@champ-r/source-list`;
const DevVersionUrl = `https://registry.npm.taobao.org/@champ-r/source-list.dev`;
const getLatestList = (version: string, isDev: boolean) => `https://cdn.jsdelivr.net/npm/@champ-r/source-list${isDev ? '.dev' : ''}@${version}/index.json`;

const ENABLED_TEST_CHANNEL = Boolean(process.env.IS_DEV || process.env.ENABLED_TEST_CHANNEL);

export default function UseSourceList() {
  const [loading, setLoading] = useState(true);
  const [sourceList, setSourceList] = useState<ISourceItem[]>(DefaultSourceList);

  const worker = useRef<number>();

  const setupTask = async () => {
    try {
      const data = await http.get(ENABLED_TEST_CHANNEL ? DevVersionUrl : VersionUrl);
      const version = data[`dist-tags`][`latest`];
      const url = getLatestList(version, ENABLED_TEST_CHANNEL);
      const rawList: ISourceItem[] = await http.get(url);
      const list = [SourceQQ, ...rawList];
      config.set(`sourceList`, list);
      setSourceList(list);
    } catch (_) {}
  };

  useEffect(() => {
    setupTask().finally(() => {
      setLoading(false);
    })

    worker.current = window.setInterval(() => {
      setupTask();
    }, TEN_MIN);

    return () => {
      clearInterval(worker.current);
    };
  }, []);

  return {
    loading,
    sourceList,
  };
}
