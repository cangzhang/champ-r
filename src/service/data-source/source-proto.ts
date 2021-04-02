import _noop from 'lodash/noop';
import axios from 'axios';
import http from 'src/service/http';

type IVoidFunc = () => void

export default class SourceProto {
  cancelHandlers: { [key: string]: IVoidFunc } = {};

  import = _noop;

  setCancelHook = (ns: string) => (cancel: IVoidFunc) => {
    this.cancelHandlers[ns] = cancel;
  };

  cancel = () => {
    Object.values(this.cancelHandlers).map((i = _noop) => i());
    return true;
  };

  getChampionList = async () => {
    try {
      const data = await http.get(
        'https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js',
        {
          cancelToken: new axios.CancelToken((c) => {
            this.setCancelHook(`fetch-champion-list`)(c);
          }),
        },
      );
      return data;
    } catch (error) {
      throw new Error(error);
    }
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
      const data = await http.get(`${cdnUrl}@${version}/package.json?${Date.now()}`);
      return data;
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  };
}
