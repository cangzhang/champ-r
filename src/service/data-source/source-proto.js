import _noop from 'lodash/noop';
import { CancelToken } from 'axios';
import http from 'src/service/http';

export default class SourceProto {
  cancelHandlers = {};

  import = _noop;

  setCancelHook = (ns) => (cancel) => {
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
          cancelToken: new CancelToken((c) => {
            this.setCancelHook(`fetch-champion-list`)(c);
          }),
        },
      );
      return data;
    } catch (error) {
      throw new Error(error);
    }
  };
}
