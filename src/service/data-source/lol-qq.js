import { nanoid as uuid } from 'nanoid';
import _get from 'lodash/get';
import _find from 'lodash/find';
import _orderBy from 'lodash/orderBy';
import _noop from 'lodash/noop';

import http, { CancelToken } from 'src/service/http';
import { parseJson, isDifferentStyleId, getStyleId, strToPercent } from 'src/service/utils';
import { addFetched, addFetching, fetchSourceDone } from 'src/share/actions';
import { SOURCE_QQ_STR, SourceQQ } from 'src/share/constants/sources';

import SourceProto from './source-proto';

const API = {
  List: 'https://game.gtimg.cn/images/lol/act/img/js/heroList/hero_list.js',
  Positions: 'https://lol.qq.com/act/lbp/common/guides/guideschampion_position.js',
  detail: (id) => `https://lol.qq.com/act/lbp/common/guides/champDetail/champDetail_${id}.js`,
  Items: 'https://ossweb-img.qq.com/images/lol/act/img/js/items/items.js',
  champInfo: (id) => `https://ossweb-img.qq.com/images/lol/act/img/js/hero/${id}.js`,
};

const makePerkData = (perk, champion, position) => {
  const { runes, winrate, igamecnt } = perk;
  const data = runes.reduce(
    ({ primaryStyleId, subStyleId }, i) => {
      if (!primaryStyleId) {
        primaryStyleId = getStyleId(+i);
      }

      if (primaryStyleId && !subStyleId) {
        const isStyleId = isDifferentStyleId(+primaryStyleId, +i);
        if (isStyleId) {
          subStyleId = getStyleId(+i);
        }
      }

      return {
        primaryStyleId,
        subStyleId,
      };
    },
    {
      primaryStyleId: ``,
      subStyleId: ``,
    },
  );

  const winRate = strToPercent(winrate, 1);

  data.name = `${champion}-${position}, pick ${igamecnt} win ${winRate}% [${SourceQQ.label}]`;
  data.selectedPerkIds = runes.map(Number);
  data.alias = champion;
  data.position = position;
  data.winRate = winRate;
  data.pickCount = igamecnt;
  data.source = SourceQQ.label;

  return data;
};

export const parseCode = (string) => {
  try {
    const [result] = string.match(/{"(.*)"}/);
    const data = parseJson(result);
    return data;
  } catch (error) {
    throw new Error(error);
  }
};

export const getLolVer = () => http.get(API.champInfo(107)).then((res) => res.version);

export const getItemList = async () => {
  try {
    const { items: itemList } = await http.get(API.Items);
    return itemList;
  } catch (error) {
    throw new Error(error);
  }
};

export default class LolQQ extends SourceProto {
  constructor(lolDir = '', itemMap = {}, dispatch = _noop) {
    super();
    this.lolDir = lolDir;
    this.itemMap = itemMap;
    this.dispatch = dispatch;
    this.pkgName = SOURCE_QQ_STR;
  }

  static getLolVersion = async () => {
    try {
      const { version } = await http.get(API.champInfo(107));
      return version;
    } catch (error) {
      throw new Error(error);
    }
  };

  getChampionList = async () => {
    try {
      const data = await http.get(API.List, {
        cancelToken: new CancelToken((c) => {
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
        cancelToken: new CancelToken((c) => {
          this.setCancelHook(`qq-positions`)(c);
        }),
      });
      const { list } = parseCode(code);
      return list;
    } catch (error) {
      throw new Error(error);
    }
  };

  getChampionPerks = async (championId, alias) => {
    try {
      const $identity = uuid();
      const apiUrl = API.detail(championId);
      const code = await http.get(apiUrl, {
        cancelToken: new CancelToken((c) => {
          this.setCancelHook($identity)(c);
        }),
      });
      const {
        list: { championLane },
      } = parseCode(code);

      const perks = Object.values(championLane).reduce((res, l) => {
        const perkDetail = parseJson(l.perkdetail);
        const position = l.lane;
        const pData = Object.values(perkDetail).reduce((result, i) => {
          const vals = Object.values(i).map(({ perk, ...rest }) => ({
            runes: perk.split(`&`),
            ...rest,
          }));
          return result.concat(vals);
        }, []);

        const sorted = _orderBy(pData, (i) => i.igamecnt, [`desc`]);
        const pages = sorted.slice(0, 2).map((i) => makePerkData(i, alias, position));

        return res.concat(pages);
      }, []);
      return _orderBy(perks, `pickCount`, [`desc`]);
    } catch (e) {
      throw new Error(e);
    }
  };

  getChampionDetail = (champions, dispatch) => async (id) => {
    try {
      const { alias } = _find(champions, { heroId: id });
      const $identity = uuid();

      dispatch(
        addFetching({
          $identity,
          champion: alias.toLowerCase(),
          source: SourceQQ.label,
        }),
      );

      const apiUrl = API.detail(id);
      const code = await http.get(apiUrl, {
        cancelToken: new CancelToken((c) => {
          this.setCancelHook($identity)(c);
        }),
      });

      dispatch(
        addFetched({
          $identity,
        }),
      );

      const data = parseCode(code);
      return data.list;
    } catch (error) {
      throw new Error(error);
    }
  };

  makeItem = ({ data, positions, champion, itemMap }) => {
    const { alias } = champion;
    const { championLane } = data;

    const result = positions.reduce((res, position) => {
      const coreItemsObj = _get(championLane, `${position}.core3itemjson`, []);
      const rawBlocks = parseJson(coreItemsObj);
      const shoeItemsObj = _get(championLane, `${position}.shoesjson`, []);
      const rawShoes = parseJson(shoeItemsObj);

      const coreItemSet = Object.values(rawBlocks).reduce((itemSet, i) => {
        const ids = i.itemid.split(`&`).map((i) => +i);
        ids.map((id) => itemSet.add(id));
        return itemSet;
      }, new Set());
      const shoeItemSet = Object.values(rawShoes).reduce((shoes, i) => {
        const shoeId = +i.itemid;
        return shoes.add(shoeId);
      }, new Set());

      const startItemsObj = _get(championLane, `${position}.itemoutjson`, []);
      const rawStarters = parseJson(startItemsObj);
      const starterItemSet = Object.values(rawStarters).reduce((obj, i) => {
        const ids = i.itemid.split(`&`).map((i) => +i);
        ids.forEach((id) => {
          const price = (_find(itemMap, { itemId: `${id}` }) || { price: 0 }).price;
          obj[id] = {
            price: +price,
            id,
          };
        });
        return obj;
      }, {});

      const coreItems = [...coreItemSet].map((id) => ({
        id: `${id}`,
        count: 1,
      }));
      const bootItems = [...shoeItemSet].map((id) => ({
        id: `${id}`,
        count: 1,
      }));
      const sortedStarters = _orderBy(Object.values(starterItemSet), (i) => i.price, [`desc`]);
      const starterItems = sortedStarters.map(({ id }) => ({
        id: `${id}`,
        count: 1,
      }));

      const blocks = [
        {
          type: `Starters`,
          items: starterItems,
          showIfSummonerSpell: '',
          hideIfSummonerSpell: '',
        },
        {
          type: `Boots`,
          items: bootItems,
          showIfSummonerSpell: '',
          hideIfSummonerSpell: '',
        },
        {
          type: `Core items`,
          items: coreItems,
          showIfSummonerSpell: '',
          hideIfSummonerSpell: '',
        },
      ];

      const item = window.bridge.file.makeBuildFile({
        fileName: `[${SourceQQ.label.toUpperCase()}] ${position} - ${alias}`,
        title: `[${SourceQQ.label.toUpperCase()}] ${position} - ${alias}`,
        championId: +champion.heroId,
        champion: alias,
        blocks,
        position,
      });

      return res.concat(item);
    }, []);

    return result;
  };

  import = async (index) => {
    const { lolDir, itemMap, dispatch } = this;

    try {
      const [{ version, hero: championList }, positionMap = {}] = await Promise.all([
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

      const fileTasks = items.map((i) => window.bridge.file.saveToFile(lolDir, i, true, index));
      const result = await Promise.all(fileTasks);

      dispatch(fetchSourceDone(SourceQQ.label));

      return result;
    } catch (error) {
      throw new Error(error);
    }
  };
}
