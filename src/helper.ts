export const isDev = import.meta.env.MODE === 'development';

export async function sleep(intv: number) {
  return new Promise((resolve) => {
      setTimeout(() => {
        resolve(null);
      }, intv);
  })
}
