import { nanoid } from 'nanoid';

export function createIpcPromise(ev: string, data?: any) {
  const jobId = nanoid();
  return new Promise((resolve, reject) => {
    window.bridge.once(`${ev}:done:${jobId}`, (ret: any) => {
      resolve(ret);
    });

    window.bridge.once(`${ev}:reject:${jobId}`, (ret: any) => {
      reject(ret);
    });

    window.bridge.sendMessage(ev, {
      ...(data ?? {}),
      jobId,
    });
  });
}
