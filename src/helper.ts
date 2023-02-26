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

  document.addEventListener(
    'keydown',
    (ev) => {
      const refresh = ev.ctrlKey && ev.key === 'r';
      const print = ev.ctrlKey && ev.key === 'p';
      const save = ev.ctrlKey && ev.key === 's';

      const back = ev.altKey && ev.key === 'ArrowLeft';
      const forward = ev.altKey && ev.key === 'ArrowRight';
      const devTool = ev.ctrlKey && ev.shiftKey && ev.key === 'i';
      const select = ev.ctrlKey && ev.shiftKey && ev.key === 'x';
      const capture = ev.ctrlKey && ev.shiftKey && ev.key === 's';

      if (
        refresh ||
        print ||
        save ||
        back ||
        forward ||
        devTool ||
        select ||
        capture
      ) {
        console.log('[blockKeyCombos] blocked');
        ev.preventDefault();
        ev.stopPropagation();
      }
    },
    true
  );

  document.addEventListener(
    'contextmenu',
    (ev) => {
      ev.preventDefault();
      ev.stopPropagation();
    },
    true
  );
}

export const ModeGroup = [
  {
    name: "Summoner's Rift",
    value: 'sr',
    color: 'cyan-500',
  },
  {
    name: 'ARAM',
    value: 'aram',
    color: 'indigo-500',
  },
  {
    name: 'URF',
    value: 'urf',
    color: 'amber-500',
  },
];

export function getColorForMode(isARAM: boolean, isURF: boolean) {
  if (isARAM) {
    return ModeGroup[1].color;
  }

  if (isURF) {
    return ModeGroup[2].color;
  }

  return ModeGroup[0].color;
}
