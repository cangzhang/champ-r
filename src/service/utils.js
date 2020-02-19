import _find from 'lodash/find';
import _sortBy from 'lodash/sortBy';
import cheerio from 'cheerio';

import http from './http';

export const requestHtml = async (url) => {
  try {
    const rawHtml = await http.get(
      url,
      // get partial html
      {
        headers: { 'X-Requested-With': 'XMLHttpRequest' },
      },
    );
    const $ = cheerio.load(rawHtml);
    return $;
  } catch (err) {
    return err;
  }
};

export const getUpgradeableCompletedItems = ({ data }) => {
  const result = Object.values(data)
    .filter(i => i.requiredAlly)
    .reduce((dataSet, item) => {
      const { from } = item;
      from.forEach(j => dataSet.add(j));
      return dataSet;
    }, new Set());

  return Array.from(result);
};

export const sortBlocksByRate = (items, itemMap) => {
  const { upgradeableCompletedItems } = itemMap;
  const { tags: StarterTags } = _find(itemMap.tree, { header: `START` });
  const startItems = [];
  const incompleteItems = [];
  const completedItems = [];
  const boots = [];

  for (const i of items) {
    const itemDetail = itemMap.data[i.id];

    const isBoot = itemDetail.tags.includes(`Boots`);
    if (isBoot) {
      boots.push(i);
      continue;
    }

    const isUpgradeableCompleted = upgradeableCompletedItems.includes(i.id);
    const isStartItem = itemDetail.tags.some(t => StarterTags.includes(t.toUpperCase()));
    const isInCompleteItem = !isStartItem && !isUpgradeableCompleted && itemDetail.into;
    const isCompletedItem = !isStartItem && (isUpgradeableCompleted || !itemDetail.into);

    isStartItem && startItems.push(i);
    isInCompleteItem && incompleteItems.push(i);
    isCompletedItem && completedItems.push(i);
  }

  const sortByPickRate = [startItems, incompleteItems, completedItems, boots].map(i => _sortBy(i, [`pRate`]));
  const sortByWinRate = [startItems, incompleteItems, completedItems, boots].map(i => _sortBy(i, [`wRate`]));

  return [sortByPickRate, sortByWinRate];
};

export const genFileBlocks = (rawItems, itemMap, showIncomplete = false) => {
  const [
    [
      pStartItems,
      pIncompleteItems,
      pCompletedItems,
      pBoots,
    ],
    [
      wStartItems,
      wIncompleteItems,
      wCompletedItems,
      wBoots,
    ],
  ] = sortBlocksByRate(rawItems, itemMap);

  return [
    {
      type: `Starter Items | by pick rate`,
      items: pStartItems,
    },
    {
      type: `Starter Items | by win rate`,
      items: wStartItems,
    },
    showIncomplete && {
      type: `Incomplete | by pick rate`,
      items: pIncompleteItems,
    },
    showIncomplete && {
      type: `Incomplete | by win rate`,
      items: wIncompleteItems,
    },
    {
      type: `Completed | by pick rate`,
      items: pCompletedItems.slice(0, 6),
    },
    {
      type: `Completed | by win rate`,
      items: wCompletedItems.slice(0, 6),
    },
    {
      type: `Boots | by pick rate`,
      items: pBoots,
    },
    {
      type: `Boots | by win rate`,
      items: wBoots,
    },
  ].filter(Boolean);
};
