import http from './http';

export const QQServicePrefix = `https://game.gtimg.cn`;

export const QQChampionAvatarPrefix = `${QQServicePrefix}/images/lol/act/img/champion`;

export const getChampions = () =>
  http.get(`${QQServicePrefix}/images/lol/act/img/js/heroList/hero_list.js`).then((res) =>
    res.hero.map((i) => ({
      ...i,
      key: i.heroId,
      id: i.alias,
    })),
  );
