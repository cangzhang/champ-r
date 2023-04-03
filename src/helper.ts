export const isDev = import.meta.env.MODE === 'development';

export async function sleep(intv: number) {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve(null);
    }, intv);
  });
}

export function blockKeyCombosInProd() {
  if (!import.meta.env.PROD) {
    return;
  }

  document.addEventListener('keydown', ev => {
    const refresh = ev.ctrlKey && ev.key === 'r';
    const print = ev.ctrlKey && ev.key === 'p';
    const save = ev.ctrlKey && ev.key === 's';

    const back = ev.altKey && ev.key === 'ArrowLeft';
    const forward = ev.altKey && ev.key === 'ArrowRight';
    const devTool = ev.ctrlKey && ev.shiftKey && ev.key === 'i';
    const select = ev.ctrlKey && ev.shiftKey && ev.key === 'x';
    const capture = ev.ctrlKey && ev.shiftKey && ev.key === 's';

    if (refresh ||
      print ||
      save ||
      back ||
      forward ||
      devTool ||
      select ||
      capture) {
      console.log('[blockKeyCombos] blocked');
      ev.preventDefault();
      ev.stopPropagation();
    }
  }, true);

  document.addEventListener('contextmenu', ev => {
    ev.preventDefault();
    ev.stopPropagation();
  }, true);
}
