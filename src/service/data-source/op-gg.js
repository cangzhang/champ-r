import { nanoid as uuid } from 'nanoid';

import { requestHtml, genFileBlocks } from 'src/service/utils';

import { addFetched, addFetching, fetchSourceDone } from 'src/share/actions';
import { saveToFile } from 'src/share/file';
import Sources from 'src/share/sources';
import SourceProto from './source-proto';

const OpggUrl = 'https://www.op.gg';

export const getSpellName = (imgSrc = '') => {
  const matched = imgSrc.match(/(.*)\/Summoner(.*)\.png/) || [''];
  return matched.pop();
};

export default class OpGG extends SourceProto {
  constructor(version, lolDir, itemMap, dispatch) {
    super();
    this.version = version;
    this.lolDir = lolDir;
    this.itemMap = itemMap;
    this.dispatch = dispatch;
  }

  getStat = async () => {
    const $ = await requestHtml(`${OpggUrl}/champion/statistics`, this.setCancelHook(`stats`));

    const items = $('.champion-index__champion-list').find('.champion-index__champion-item');
    const result = items
      .toArray()
      .map(itm => {
        const champ = $(itm);
        const { championKey, championName } = champ.data();
        const positions = champ
          .find('.champion-index__champion-item__position')
          .toArray()
          .map(i => $(i).text().toLowerCase());

        return {
          key: championKey,
          name: championName,
          positions: positions.slice(),
        };
      });

    return result;
  };

  genBlocks = async (champion, position, id) => {
    const { itemMap } = this;
    try {
      const $ = await requestHtml(`${OpggUrl}/champion/${champion}/statistics/${position}/item`, this.setCancelHook(id));
      const itemTable = $('.l-champion-statistics-content__side .champion-stats__table')[0];
      const rawItems = $(itemTable)
        .find('tbody tr')
        .toArray()
        .map(tr => {
          const [itemTd, pRateTd, wRateTd] = $(tr).find('td').toArray();
          const itemId = $(itemTd).find('img').attr('src').match(/(.*)\/(.*)\.png/).pop();
          const pRate = $(pRateTd).find('em').text().replace(',', '');
          const wRate = $(wRateTd).text().replace('%', '');

          return {
            id: itemId,
            count: 1,
            pRate,
            wRate,
          };
        });

      const blocks = genFileBlocks(rawItems, itemMap, position);
      return blocks;
    } catch (error) {
      throw new Error(error);
    }
  };

  genSkills = async (champion, position, id) => {
    try {
      const $ = await requestHtml(`${OpggUrl}/champion/${champion}/statistics/${position}/skill`, this.setCancelHook(id));

      const skills = $('.champion-stats__filter__item .champion-stats__list')
        .toArray()
        .map(i =>
          $(i).find('.champion-stats__list__item')
            .toArray()
            .map(j => $(j).text().trim()),
        );

      return skills;
    } catch (error) {
      throw new Error(error);
    }
  };

  genChampionData = async (championName, position, id) => {
    const { version } = this;

    if (!championName || !position) {
      return Promise.reject('Please specify champion & position.');
    }

    try {
      const [blocks, skills] = await Promise.all([
        this.genBlocks(championName, position, `${id}-block`),
        this.genSkills(championName, position, `${id}-skill`),
      ]);

      return {
        sortrank: 1,
        priority: false,
        map: 'any',
        mode: 'any',
        type: 'custom',
        key: championName,
        champion: championName,
        position,
        title: `[OP.GG] ${position} - ${version}`,
        fileName: `[OP.GG]${championName}-${position}-${version}`,
        skills,
        blocks,
      };
    } catch (error) {
      throw new Error(error);
    }
  };

  import = async () => {
    const { dispatch, lolDir } = this;
    try {
      const res = await this.getStat();

      const tasks = res
        .reduce((t, item) => {
          const { positions, key: champion } = item;
          const positionTasks = positions.map(position => {
            const identity = uuid();

            dispatch(addFetching({
              champion,
              position,
              $identity: identity,
              source: Sources.Opgg,
            }));

            return this.genChampionData(champion, position, identity)
              .then(data => {
                dispatch(addFetched({
                  ...data,
                  $identity: identity,
                }));

                return data;
              });
          });

          return t.concat(positionTasks);
        }, []);

      const fetched = await Promise.all(tasks);
      const t = fetched.map(i => saveToFile(lolDir, i));

      const result = await Promise.all(t);
      dispatch(fetchSourceDone(Sources.Opgg));

      return result;
    } catch (error) {
      throw new Error(error);
    }
  };
}

