import _noop from 'lodash/noop';
import http from 'src/service/http';
import { IPkgInfo } from 'src/typings/commonTypes'

type IVoidFunc = () => void

interface ICachedReq<T> {
  done: boolean;
  lastTime: number;
  result?: T;
}

export const fetchLatestVersionFromCdn = async (url: string, timeout = 60 * 1000) => {
  const versionReq: { [key: string]: ICachedReq<string> } = {};

  try {
    const now = Date.now();
    const target = versionReq[url];

    if (target?.done && now - (target?.lastTime ?? 0) < timeout) {
      return target?.result;
    }

    const req: ICachedReq<string> = {
      done: false,
      lastTime: 0,
    };
    const data = await http.get(`${url}?t=${Date.now()}`);
    req.done = true;
    req.lastTime = Date.now();
    req.result = data[`dist-tags`].latest;
    versionReq[url] = req;

    return req.result;
  } catch (err) {
    console.error(err.message, err.stack);
    return Promise.reject(err);
  }
};

export default class SourceProto {
  public cancelHandlers: { [key: string]: IVoidFunc } = {};

  public import = _noop;

  public setCancelHook = (ns: string) => (cancel: IVoidFunc) => {
    this.cancelHandlers[ns] = cancel;
  };

  public cancel = () => {
    Object.values(this.cancelHandlers).map((i = _noop) => i());
    return true;
  };

  static getPkgInfo = async (npmUrl: string, cdnUrl: string) => {
    try {
      const version = await fetchLatestVersionFromCdn(npmUrl);
      const data: IPkgInfo = await http.get(`${cdnUrl}@${version}/package.json?${Date.now()}`);
      return data;
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  };
}
