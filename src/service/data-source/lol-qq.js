import { nanoid as uuid } from 'nanoid';
import _get from 'lodash/get';
import _find from 'lodash/find';
import _orderBy from 'lodash/orderBy';
import { CancelToken } from 'axios';

import http from 'src/service/http';
import { saveToFile } from 'src/share/file';
import { genFileBlocks, parseJson, isDifferentStyleId } from 'src/service/utils';
import { addFetched, addFetching, fetchSourceDone } from 'src/share/actions';
import Sources from 'src/share/sources';

import SourceProto from './source-proto';
// Import { Actions } from 'src/share/actions';

const API = {
  List: 'https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js',
  Positions: 'https://lol.qq.com/act/lbp/common/guides/guideschampion_position.js',
  detail: id => `https://lol.qq.com/act/lbp/common/guides/champDetail/champDetail_${id}.js`,
  Items: 'https://ossweb-img.qq.com/images/lol/act/img/js/items/items.js',
};

const getStyleId = i => i.replace(/\d{2}$/, `00`);
const strToPercent = str => parseInt(str / 100, 10);

const makePerkData = (perk, champion, position) => {
  const { runes, winrate, showrate } = perk;
  const data = runes.reduce(({ primaryStyleId, subStyleId }, i) => {
    if (!primaryStyleId) {
      primaryStyleId = getStyleId(i);
    }

    if (primaryStyleId && !subStyleId) {
      const isStyleId = isDifferentStyleId(primaryStyleId, i);
      if (isStyleId) {
        subStyleId = getStyleId(i);
      }
    }

    return {
      primaryStyleId,
      subStyleId,
    };
  }, {
    primaryStyleId: ``,
    subStyleId: ``,
  });

  data.selectedPerkIds = runes;
  const wRate = strToPercent(winrate);
  const pRate = strToPercent(showrate);
  data.name = `[lol.qq.com]${champion}-${position}, win ${wRate}%, pick ${pRate}%`;

  return data;
};

export const parseCode = string => {
  try {
    const [result] = string.match(/{"(.*)"}/);
    const data = parseJson(result);
    return data;
  } catch (error) {
    throw new Error(error);
  }
};

export const getItemList = async () => {
  try {
    const { items: itemList } = await http.get(API.Items);
    return itemList;
  } catch (error) {
    throw new Error(error);
  }
};

export default class LolQQ extends SourceProto {
  constructor(lolDir, itemMap, dispatch) {
    super();
    this.lolDir = lolDir;
    this.itemMap = itemMap;
    this.dispatch = dispatch;
  }

  getChampionList = async () => {
    try {
      const data = await http.get(API.List, {
        cancelToken: new CancelToken(c => {
          this.setCancelHook(`qq-stats`)(c);
        }),
      });
      return data;
    } catch (error) {
      throw new Error(error);
    }
  };

  getChampionPositions = async () => {
    try {
      const code = await http.get(API.Positions, {
        cancelToken: new CancelToken(c => {
          this.setCancelHook(`qq-positions`)(c);
        }),
      });
      const { list } = parseCode(code);
      return list;
    } catch (error) {
      throw new Error(error);
    }
  };

  getChampionDetail = (champions, dispatch) => async id => {
    try {
      const { alias } = _find(champions, { heroId: id });
      const $identity = uuid();

      dispatch(addFetching({
        $identity,
        champion: alias.toLowerCase(),
        source: Sources.Lolqq,
      }));

      const apiUrl = API.detail(id);
      const code = await http.get(apiUrl, {
        cancelToken: new CancelToken(c => {
          this.setCancelHook($identity)(c);
        }),
      });

      dispatch(addFetched({
        $identity,
      }));

      const data = parseCode(code);
      return data.list;
    } catch (error) {
      throw new Error(error);
    }
  };

  makeItem = ({ data, positions, champion, version, itemMap }) => {
    const { alias } = champion;
    const { championLane } = data;

    const result = positions.reduce((res, position) => {
      const perkDetail = parseJson(championLane[position].perkdetail);
      const perkData = Object.values(perkDetail).reduce((result, i) => {
        const vals = Object.values(i).map(({ perk, ...rest }) => ({
          runes: perk.split(`&`),
          ...rest,
        }));
        return result.concat(vals);
      }, []);

      // TODO: perks
      const byWinRate = _orderBy(perkData, i => i.winrate, [`desc`]);
      const byPickRate = _orderBy(perkData, i => i.showrate, [`desc`]);
      const perks = [...byWinRate.slice(0, 2), ...byPickRate.slice(0, 2)]
        .map(i => makePerkData(i, alias, position));

      const laneItemsString = _get(championLane, `${position}.hold3`, []);
      const rawBlocks = parseJson(laneItemsString);
      const rawItems = rawBlocks.map(i => ({
        id: i.itemid,
        count: 1,
        pRate: i.showrate,
        wRate: i.winrate,
      }));

      const blocks = genFileBlocks(rawItems, itemMap, position);

      const item = {
        sortrank: 1,
        priority: false,
        map: 'any',
        mode: 'any',
        type: 'custom',
        key: alias.toLowerCase(),
        champion: alias,
        position,
        title: `[LOL.QQ.COM] ${position} - ${version}`,
        fileName: `[LOL.QQ.COM]${alias}-${position}-${version}`,
        skills: [],
        blocks,
        perks,
      };

      return res.concat(item);
    }, []);

    return result;
  };

  import = async () => {
    const {
      lolDir,
      itemMap,
      dispatch,
    } = this;

    try {
      const [
        {
          version,
          hero: championList,
        },
        positionMap,
      ] = await Promise.all([
        this.getChampionList(),
        this.getChampionPositions(),
      ]);

      const championIds = Object.keys(positionMap);
      const tasks = championIds.map(this.getChampionDetail(championList, dispatch));
      const detailList = await Promise.all(tasks);

      const items = detailList.reduce((res, item, idx) => {
        const id = championIds[idx];
        const positions = Object.keys(positionMap[id]);
        const champion = _find(championList, { heroId: id });

        const block = this.makeItem({
          data: item,
          positions,
          champion,
          version,
          itemMap,
        });
        return res.concat(block);
      }, []);

      const fileTasks = items.map(i => saveToFile(lolDir, i));
      const result = await Promise.all(fileTasks);

      dispatch(fetchSourceDone(Sources.Lolqq));

      return result;
    } catch (error) {
      throw new Error(error);
    }
  };
}
