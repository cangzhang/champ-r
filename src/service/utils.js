import _find from 'lodash/find';
import _sortBy from 'lodash/sortBy';
import cheerio from 'cheerio';

import { flatRunes } from 'src/share/constants/runes';
import http, { CancelToken } from './http';

const RequestLocale = `en-US`;

export const requestHtml = async (url, setCancel, isAjax = true, showHtml = false) => {
  try {
    const rawHtml = await http.get(
      url,
      // Get partial html
      {
        headers: {
          'X-Requested-With': isAjax ? `XMLHttpRequest` : ``,
          'Content-Language': RequestLocale,
          'Accept-Language': RequestLocale,
        },
        cancelToken: new CancelToken((c) => {
          if (setCancel) {
            setCancel(c);
          }
        }),
      },
    );
    const $ = cheerio.load(rawHtml);
    showHtml && console.log(rawHtml);
    return $;
  } catch (error) {
    console.error(`request failed: `, url, error);
    // throw new Error(error);
    return Promise.reject(error);
  }
};

export const getUpgradeableCompletedItems = (param) => {
  const data = param.data || param;
  const result = Object.values(data)
    .filter((i) => i.requiredAlly)
    .reduce((dataSet, item) => {
      const { from } = item;
      (from || []).forEach((j) => dataSet.add(j));
      return dataSet;
    }, new Set());

  return Array.from(result);
};

const isItStartItem = (itemDetail, itemMap, isJungle) => {
  const { tags: StarterTags } = _find(itemMap.tree, { header: 'START' });
  const { tags, gold } = itemDetail;

  const hasStartTag = tags.some((t) => StarterTags.includes(t.toUpperCase()));
  const hasJungleTag = tags.join(`,`).toLowerCase().includes(`jungle`);
  const affordable = gold.total <= 500;

  return hasStartTag && affordable && (isJungle ? hasJungleTag : true);
};

export const sortBlocksByRate = (items, itemMap, position) => {
  const { upgradeableCompletedItems } = itemMap;
  const startItems = [];
  const incompleteItems = [];
  const completedItems = [];
  const boots = [];

  for (const i of items) {
    const itemDetail = itemMap.data[i.id];

    const isBoot = itemDetail.tags.includes('Boots');
    if (isBoot) {
      boots.push(i);
      continue;
    }

    const isUpgradeableCompleted = upgradeableCompletedItems.includes(i.id);
    const isStartItem = isItStartItem(itemDetail, itemMap, position.toLowerCase() === 'jungle');
    const isInCompleteItem = !isStartItem && !isUpgradeableCompleted && itemDetail.into;
    const isCompletedItem = !isStartItem && (isUpgradeableCompleted || !itemDetail.into);

    isStartItem && startItems.push(i);
    isInCompleteItem && incompleteItems.push(i);
    isCompletedItem && completedItems.push(i);
  }

  const sortByPickRate = [startItems, incompleteItems, completedItems, boots].map((i) =>
    _sortBy(i, ['pickRate']),
  );
  const sortByWinRate = [startItems, incompleteItems, completedItems, boots].map((i) =>
    _sortBy(i, ['winRate']),
  );

  return [sortByPickRate, sortByWinRate];
};

export const genFileBlocks = (rawItems, itemMap, position, showIncomplete = false) => {
  const [
    [pStartItems, pIncompleteItems, pCompletedItems, pBoots],
    [wStartItems, wIncompleteItems, wCompletedItems, wBoots],
  ] = sortBlocksByRate(rawItems, itemMap, position);

  return [
    {
      type: 'Starter Items | by pick rate',
      items: pStartItems,
    },
    {
      type: 'Starter Items | by win rate',
      items: wStartItems,
    },
    showIncomplete && {
      type: 'Incomplete | by pick rate',
      items: pIncompleteItems,
    },
    showIncomplete && {
      type: 'Incomplete | by win rate',
      items: wIncompleteItems,
    },
    {
      type: 'Completed | by pick rate',
      items: pCompletedItems.slice(0, 6),
    },
    {
      type: 'Completed | by win rate',
      items: wCompletedItems.slice(0, 6),
    },
    {
      type: 'Boots | by pick rate',
      items: pBoots,
    },
    {
      type: 'Boots | by win rate',
      items: wBoots,
    },
  ].filter(Boolean);
};

export const parseJson = (str) => {
  try {
    return JSON.parse(str);
  } catch {
    return {};
  }
};

export const getStyleId = (i) => {
  let result = null;
  for (const [mId, ids] of flatRunes) {
    if (+i === +mId) {
      result = +i;
      break;
    }

    if (ids.includes(+i)) {
      result = +mId;
      break;
    }
  }
  return result;
};

export const isDifferentStyleId = (a, b) => {
  if (!a || !b) {
    return false;
  }

  const idA = getStyleId(a);
  const idB = getStyleId(b);
  const notSame = idA !== idB;

  return idA && idB && notSame;
};

export const strToPercent = (str, decimal = 2) => (str / 100).toFixed(decimal);
