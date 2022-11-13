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
    let refresh = ev.ctrlKey && ev.key === 'r';
    let print = ev.ctrlKey && ev.key === 'p';
    let save = ev.ctrlKey && ev.key === 's';

    let back = ev.altKey && ev.key === 'ArrowLeft';
    let forward = ev.altKey && ev.key === 'ArrowRight';
    let devTool = ev.ctrlKey && ev.shiftKey && ev.key === 'i';
    let select = ev.ctrlKey && ev.shiftKey && ev.key === 'x';
    let capture = ev.ctrlKey && ev.shiftKey && ev.key === 's';

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
