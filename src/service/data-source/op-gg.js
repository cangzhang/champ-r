import { nanoid as uuid } from 'nanoid';
import _noop from 'lodash/noop';
import _find from 'lodash/find';

import { requestHtml } from 'src/service/utils';
import http from 'src/service/http';

import { addFetched, addFetching, fetchSourceDone, clearFetch } from 'src/share/actions';
import { makeBuildFile, saveToFile } from 'src/share/file';
import Sources from 'src/share/constants/sources';
import SourceProto from './source-proto';
import { CancelToken } from 'axios';

const OpggUrl = `https://www.op.gg`;
const CDN_URL = `https://cdn.jsdelivr.net/npm/@champ-r/op.gg@latest`;

export const getSpellName = (imgSrc = '') => {
  const matched = imgSrc.match(/(.*)\/Summoner(.*)\.png/) || [''];
  return matched.pop();
};

export const stripNumber = (src) => +src.match(/(\d+)\.png/)[1];

const getItems = (imgs, $) => {
  const ids = imgs.map((img) => {
    const itemId = $(img)
      .attr('src')
      .match(/(.*)\/(.*)\.png/)
      .pop();

    return +itemId;
  });

  return [...new Set(ids)].map((id) => ({
    id: `${id}`,
    count: 1,
  }));
};

const Stages = {
  FETCH_CHAMPION_LIST: `FETCH_CHAMPION_LIST`,
  FETCH_CHAMPION_DATA: `FETCH_CHAMPION_DATA`,
  GEN_DATA_FILE: `GEN_DATA_FILE`,
};

export default class OpGG extends SourceProto {
  constructor(version = ``, lolDir = ``, itemMap = {}, dispatch = _noop) {
    super();
    this.version = version;
    this.lolDir = lolDir;
    this.itemMap = itemMap;
    this.dispatch = dispatch;
  }

  static getLolVersion = async () => {
    try {
      const $ = await requestHtml(`${OpggUrl}/champion/rengar/statistics/jungle`, null, false);
      const versionText = $(`.champion-stats-header-version`).text().trim();
      const match = versionText.match(/\d|\./g) || [];
      const version = match.join(``);
      // this.version = version;
      return version;
    } catch (error) {
      console.error(error);
      return Promise.reject(error);
      // throw new Error(error);
    }
  };

  static getSourceVersion = async () => {
    try {
      const { sourceVersion } = await http.get(`${CDN_URL}/package.json?${Date.now()}`);
      return sourceVersion;
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  };

  getChampionList = async () => {
    try {
      const data = await http.get(`${CDN_URL}/index.json?${Date.now()}}`, {
        cancelToken: new CancelToken(this.setCancelHook(`fetch-champion-list`)),
      });
      return data;
    } catch (err) {
      console.error(err);
      return Promise.reject({
        stage: Stages.FETCH_CHAMPION_LIST,
      });
    }
  };

  getChampionData = async (champion, $identity) => {
    try {
      const data = await http.get(`${CDN_URL}/${champion}.json?${Date.now()}`, {
        cancelToken: new CancelToken(this.setCancelHook($identity)),
      });
      return data;
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  };

  genItemBuilds = async (champion, lolDir) => {
    try {
      const $identity = uuid();
      this.dispatch(
        addFetching({
          champion,
          $identity,
          source: Sources.Opgg,
        }),
      );

      const data = await this.getChampionData(champion);
      const tasks = data.reduce((t, i) => {
        const { position, itemBuilds } = i;
        itemBuilds.forEach((k) => {
          const file = {
            ...k,
            champion,
            position,
            fileName: `[${Sources.Opgg.toUpperCase()}] ${position} - ${champion}`,
          };
          t = t.concat(saveToFile(lolDir, file));
        });

        return t;
      }, []);

      const r = await Promise.allSettled(tasks);

      this.dispatch(
        addFetched({
          champion,
          $identity,
          source: Sources.Opgg,
        }),
      );

      return r;
    } catch (err) {
      console.error(err);
      return Promise.reject({
        champion: champion,
        stage: Stages.GEN_DATA_FILE,
      });
    }
  };

  getRunesFromCdn = async (alias) => {
    try {
      const $id = uuid();
      const data = await this.getChampionData(alias, $id);
      return data.reduce((arr, i) => arr.concat(i.runes), []);
    } catch (err) {
      console.error(err);
      return Promise.reject(err);
    }
  };

  importFromCDN = async (lolDir) => {
    try {
      const championMap = await this.getChampionList();
      const tasks = Object.keys(championMap).map((champion) =>
        this.genItemBuilds(champion, lolDir),
      );
      const r = await Promise.allSettled(tasks);
      const result = r.reduce(
        (arr, cur) =>
          arr.concat(
            cur.status === `rejected`
              ? {
                  status: `rejected`,
                  value: cur.reason,
                  reason: cur.reason,
                }
              : cur.value,
          ),
        [],
      );

      const [fulfilled, rejected] = this.makeResult(result);
      return {
        fulfilled,
        rejected,
      };
    } catch (err) {
      console.error(err);
      throw new Error(err);
    }
  };

  getStat = async () => {
    try {
      const $ = await requestHtml(`${OpggUrl}/champion/statistics`, this.setCancelHook(`stats`));
      const items = $('.champion-index__champion-list').find('.champion-index__champion-item');
      const result = items.toArray().map((itm) => {
        const champ = $(itm);
        const { championKey, championName } = champ.data();
        const positions = champ
          .find('.champion-index__champion-item__position')
          .toArray()
          .map((i) => $(i).text().toLowerCase());

        return {
          key: championKey,
          name: championName,
          positions: positions.slice(),
        };
      });

      return result;
    } catch (error) {
      console.error(error);
      // throw new Error(error);
      return Promise.reject({
        stage: Stages.FETCH_CHAMPION_LIST,
      });
    }
  };

  getPerksFromHtml = (alias, position, $) => {
    const perks = $('[class*=ChampionKeystoneRune] tr')
      .toArray()
      .reduce((arr, i) => {
        const styleIds = $(i)
          .find(`.perk-page__item--active img`)
          .toArray()
          .map((i) => {
            const src = $(i).attr(`src`);
            return stripNumber(src);
          });
        const fragmentIds = $(i)
          .find(`.fragment__detail img.active`)
          .toArray()
          .map((i) => {
            const src = $(i).attr(`src`);
            return stripNumber(src);
          });
        const [primaryStyleId, subStyleId] = $(i)
          .find(`.perk-page__item--mark img`)
          .toArray()
          .map((i) => {
            const src = $(i).attr(`src`);
            return stripNumber(src);
          });
        const pickCount = +$(i).find(`.pick-ratio__text`).next().next().text().replace(`,`, '');
        const winRate = $(i).find(`.win-ratio__text`).next().text().replace(`%`, '');

        const data = {
          alias: alias,
          pickCount: pickCount,
          winRate: winRate,
          position: position,
          source: Sources.Opgg,
          primaryStyleId: primaryStyleId,
          subStyleId: subStyleId,
          selectedPerkIds: styleIds.concat(fragmentIds),
          name: `${alias}-${position}, pick ${pickCount} win ${winRate}% [${Sources.Opgg}]`,
        };
        return arr.concat(data);
      }, []);

    return perks;
  };

  getChampionPerks = async (alias) => {
    try {
      const $id = uuid();
      const $ = await requestHtml(
        `${OpggUrl}/champion/${alias}/statistics`,
        this.setCancelHook($id),
        false,
      );

      const positions = $(`.champion-stats-header__position a`)
        .toArray()
        .map((i) => {
          const href = $(i).attr(`href`);
          return href.split(`/`).pop();
        });
      const firstPositionPerks = this.getPerksFromHtml(alias, positions[0], $);
      const tasks = positions.slice(1).map(async (p) => {
        const $ = await requestHtml(
          `${OpggUrl}/champion/${alias}/statistics/${p}`,
          this.setCancelHook(`${$id}-${p}`),
        );
        return this.getPerksFromHtml(alias, p, $);
      });
      const [allLeftPerks = []] = await Promise.all(tasks);

      return firstPositionPerks.concat(allLeftPerks);
    } catch (err) {
      console.error(err);
      // throw new Error(err);
      return Promise.reject({
        champion: alias,
        stage: Stages.FETCH_CHAMPION_DATA,
      });
    }
  };

  genBlocks = async (champion, position, id) => {
    const { itemMap } = this;
    try {
      const $ = await requestHtml(
        `${OpggUrl}/champion/${champion}/statistics/${position}/item`,
        this.setCancelHook(id),
      );

      const tables = $(`.l-champion-statistics-content__main tbody`);
      const coreItemImgs = $(tables[0]).find(`tr td li.champion-stats__list__item img`).toArray();
      const coreItems = getItems(coreItemImgs, $);

      const bootItemImgs = $(tables[1])
        .find(`tbody tr td .champion-stats__single__item img`)
        .toArray();
      const bootItems = getItems(bootItemImgs, $);

      const rawStarterItems = $(tables[2])
        .find(`tbody tr td li.champion-stats__list__item img`)
        .toArray()
        .map((img) => {
          const itemId = $(img)
            .attr('src')
            .match(/(.*)\/(.*)\.png/)
            .pop();

          return +itemId;
        })
        .sort((a, b) => {
          const priceA = (_find(itemMap, { itemId: `${a}` }) || { price: 0 }).price;
          const priceB = (_find(itemMap, { itemId: `${b}` }) || { price: 0 }).price;

          return priceB - priceA;
        });
      const starterItems = [...new Set(rawStarterItems)].map((id) => ({
        id: `${id}`,
        count: 1,
      }));

      return [
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
          type: `Core Items`,
          items: coreItems,
          showIfSummonerSpell: '',
          hideIfSummonerSpell: '',
        },
      ];
    } catch (error) {
      console.error(error);
      // throw new Error(error);
      return Promise.reject({
        champion,
        position,
        stage: Stages.FETCH_CHAMPION_DATA,
      });
    }
  };

  genChampionData = async (championName, position, id) => {
    if (!championName || !position) {
      return Promise.reject('Please specify champion & position.');
    }

    const { alias, heroId } = _find(
      this.championList,
      (i) => i.alias.toLowerCase() === championName.toLowerCase(),
    );

    try {
      const [blocks] = await Promise.all([
        this.genBlocks(championName, position, `${id}-block`),
        // this.genSkills(championName, position, `${id}-skill`),
        // this.genPerk(championName, position, `${id}-perk`),
      ]);

      const item = makeBuildFile({
        fileName: `[${Sources.Opgg.toUpperCase()}] ${position} - ${alias}`,
        title: `[${Sources.Opgg.toUpperCase()}] ${position} - ${alias}`,
        championId: +heroId,
        champion: alias,
        position,
        blocks,
      });

      return item;
    } catch (error) {
      console.error(error);
      // throw new Error(error);
      return Promise.reject({
        champion: alias,
        position,
        stage: Stages.FETCH_CHAMPION_DATA,
      });
    }
  };

  makeResult = (result) => {
    const fulfilled = [];
    const rejected = [];
    for (const v of result) {
      const { status, value, reason } = v || {};
      switch (status) {
        case 'fulfilled':
          fulfilled.push([value.champion, value.position]);
          break;
        case 'rejected':
          rejected.push([reason.champion, reason.position]);
          break;
        default:
          break;
      }
    }

    return [fulfilled, rejected];
  };

  importSpecified = async (data) => {
    const { dispatch, lolDir } = this;

    try {
      dispatch(clearFetch());

      const tasks = data.map(([champion, position]) => {
        const identity = uuid();
        dispatch(
          addFetching({
            champion,
            position,
            $identity: identity,
            source: Sources.Opgg,
          }),
        );

        return this.genChampionData(champion, position, identity).then((data) => {
          dispatch(
            addFetched({
              ...data,
              $identity: identity,
            }),
          );

          return saveToFile(lolDir, data);
        });
      });

      const result = await Promise.allSettled(tasks);
      const [fulfilled, rejected] = this.makeResult(result);

      return {
        fulfilled,
        rejected,
      };
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  };

  import = async () => {
    const { dispatch, lolDir } = this;
    try {
      const [allChampions, { hero: championList }] = await Promise.all([
        this.getStat(),
        this.getChampionList(),
      ]);
      this.championList = championList;

      const tasks = allChampions.reduce((t, item) => {
        const { positions, key: champion } = item;
        const positionTasks = positions.map((position) => {
          const identity = uuid();

          dispatch(
            addFetching({
              champion,
              position,
              $identity: identity,
              source: Sources.Opgg,
            }),
          );

          return this.genChampionData(champion, position, identity).then((data) => {
            dispatch(
              addFetched({
                ...data,
                $identity: identity,
              }),
            );

            return saveToFile(lolDir, data);
          });
        });

        return t.concat(positionTasks);
      }, []);

      const result = await Promise.allSettled(tasks);
      const [fulfilled, rejected] = this.makeResult(result);

      if (!rejected.length) {
        dispatch(fetchSourceDone(Sources.Opgg));
      }

      return {
        fulfilled,
        rejected,
      };
    } catch (error) {
      console.error(error);
      throw new Error(error);
    }
  };
}
