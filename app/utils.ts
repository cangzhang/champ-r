import { promises as fs, constants as fsConstants } from 'fs';
import * as path from 'path';

import appStore from '../src/native/config';
import cjk from 'cjk-regex';

const cjk_charset = cjk();

export async function ifIsCNServer(dir: string) {
  const target = path.join(dir, `TCLS`, `Client.exe`);
  let result = false;
  try {
    await fs.access(dir, fsConstants.F_OK);
    await fs.access(target, fsConstants.F_OK);
    result = true;
  } catch (err) {
    console.info(err);
  }

  appStore.set(`appendGameToDir`, result);
  const hasCjk = hasCJKChar(dir);
  appStore.set(`lolDirHasCJKChar`, hasCjk);
  console.log('shouldAppendGameToDir: ', result, `lolDirHasCJKChar: `, hasCjk);
  return result;
}

export const hasCJKChar = (p: string) => {
  return cjk_charset.toRegExp().test(p);
};
