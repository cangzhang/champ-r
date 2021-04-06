import _noop from 'lodash/noop';
import http from 'src/service/http';
import { IPkgInfo } from 'src/typings/commonTypes'

type IVoidFunc = () => void

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

  static getLatestVersionFromCdn = async (url: string) => {
    try {
      const data = await http.get(`${url}?t=${Date.now()}`);
      return data[`dist-tags`].latest;
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  };

  static getPkgInfo = async (npmUrl: string, cdnUrl: string) => {
    try {
      const version = await SourceProto.getLatestVersionFromCdn(npmUrl);
      const data: IPkgInfo = await http.get(`${cdnUrl}@${version}/package.json?${Date.now()}`);
      return data;
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  };
}
