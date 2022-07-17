import { machineId } from 'node-machine-id';
import { appConfig } from './config';

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
