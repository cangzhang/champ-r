import _pick from 'lodash/pick';
import fse from 'fs-extra';
import { promises as fs } from 'fs';
import * as path from 'path';
import { TextDecoder, TextEncoder } from 'util';

import config from 'src/native/config';
import { IChampionBuild } from 'src/typings/commonTypes';

const ItemSetProps = [
  'title',
  'type',
  'associatedMaps',
  'associatedChampions',
  'map',
  'mode',
  'preferredItemSlots',
  'sortrank',
  'startedFrom',
  'blocks',
];

export const utf8ToGb18030 = (str: string) => {
  const uint8array = new TextEncoder().encode(str);
  const ret = new TextDecoder(`gb18030`).decode(uint8array);
  return ret;
};

export const makeBuildFile = (
  { fileName, title, championId, champion, blocks, position = `` }: IChampionBuild,
  aramOnly = false,
) => ({
  fileName,
  title,
  key: champion.toLowerCase(),
  champion: champion,
  position,

  type: 'custom',
  associatedMaps: aramOnly ? [12] : [11, 12],
  associatedChampions: [+championId],
  map: 'any',
  mode: 'any',
  preferredItemSlots: [],
  sortrank: 1,
  startedFrom: 'blank',

  blocks: blocks.filter(Boolean),
});

export const saveToFile = async (desDir: string, data: IChampionBuild, stripProps = true) => {
  try {
    const appendGameToDir = config.get(`appendGameToDir`);
    const hasCjkChar = config.get(`lolDirHasCJKChar`);

    const file = `${appendGameToDir ? `${desDir}/Game` : desDir}/Config/Champions/${data.champion
    }/Recommended/${data.fileName}.json`;
    const content = stripProps ? _pick(data, ItemSetProps) : data;
    await fse.outputFile(file, JSON.stringify(content, null, 4));

    if (appendGameToDir && hasCjkChar) {
      const cnFile = utf8ToGb18030(file);
      await fse.outputFile(cnFile, JSON.stringify(content, null, 4));
    }

    return {
      champion: data.champion,
      position: data.position,
    };
  } catch (error) {
    return error;
  }
};

export const removeFolderContent = async (dir: string) => {
  try {
    await fse.emptyDir(dir);
    return true;
  } catch (error) {
    return error;
  }
};

export const getLatestLogFile = async (dir: string) => {
  try {
    const files = await fs.readdir(dir);
    const latest = files
      .filter((f: string) => f.includes(`renderer.log`))
      .sort((a: string, b: string) => a.localeCompare(b))
      .pop();
    const info = await fs.stat(`${dir}/${latest}`);
    return info;
  } catch (err) {
    return;
  }
};

const authReg = /https:\/\/riot:.+@127\.0\.0\.1:\d+\/index.html/;

export const getLcuTokenFromLog = async (dirPath: string) => {
  const appendGameToDir = config.get(`appendGameToDir`);
  const dir = `${appendGameToDir ? `${dirPath}/Game` : dirPath}/Logs/LeagueClient Logs`;

  try {
    const files = await fs.readdir(dir);
    const rendererLogs = files
      .filter((f: string) => f.includes(`renderer.log`))
      .sort((a: string, b: string) => b.localeCompare(a));

    let content = '';
    for (const f of rendererLogs) {
      content = await fs.readFile(`${dir}/${f}`, 'utf8');
      if (authReg.test(content)) {
        console.info(`target log file is: `, `${dir}/${f}`);
        break;
      }
      continue;
    }

    if (!content) {
      console.error(`[LCU] cannot find target renderer log.`);
      return [null, null, null];
    }

    const url = content.match(/https(.*)\/index\.html/)?.[1] ?? ``;
    const token = url.match(/riot:(.*)@/)?.[1] ?? null;
    const port = url.match(/:(\d+)$/)?.[1] ?? null;
    const urlWithAuth = `https${url}`;

    return [token, port, urlWithAuth];
  } catch (err) {
    return [null, null, null];
  }
};

export const getLcuToken = async (dirPath: string) => {
  const appendGameToDir = config.get(`appendGameToDir`); // if lcu is CN client
  const lockfilePath = path.join(dirPath, appendGameToDir ? 'LeagueClient' : '', 'lockfile');

  try {
    const lockfile = await fs.readFile(lockfilePath, 'utf8');
    const port = lockfile.split(`:`)[2];
    const token = lockfile.split(`:`)[3];
    const url = `://riot:${token}@127.0.0.1:${port}`;
    const urlWithAuth = `https${url}`;

    return [token, port, urlWithAuth];
  } catch (err) {
    return [null, null, null];
  }
};
