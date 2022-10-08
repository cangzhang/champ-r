import { machineId } from 'node-machine-id';
import axios from 'axios';

import { appConfig } from './config';
import { IChampionMap } from '@interfaces/commonTypes';

export function sleep(ms: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, ms)
  })
}

export async function getMachineId() {
  const userId = appConfig.get(`userId`);
  if (userId) return userId;

  const id = await machineId();
  appConfig.set(`userId`, id);
  return id;
}

export const isDev = process.env.IS_DEV_MODE === `true`;

export async function getChampionList() {
  try {
    let [v] = await axios(`https://ddragon.leagueoflegends.com/api/versions.json`).then(r => r.data);
    console.log(`[main/getChampionList] latest official version is ${v}`);
    let body: any = await axios(`https://ddragon.leagueoflegends.com/cdn/${v}/data/en_US/champion.json`).then(r => r.data);
    return body.data as IChampionMap;
  } catch (e) {
    console.log(`[main/getChampionList] error`, e)
    return {} as IChampionMap;
  }
}
