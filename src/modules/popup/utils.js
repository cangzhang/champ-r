export const getChampionInfo = (id, championMap) => {
  if (!championMap) return {};

  const champion = Object.values(championMap).find((i) => i.key * 1 === id * 1);
  return champion || {};
};
