import { promises as fs } from "fs";
import * as path from "path";
import config from '../src/native/config'
import { Stats } from "fs-extra";

export async function getFileContent(path: string): Promise<[string, Stats | null]> {
  try {
    const stat = await fs.stat(path);
    const content = await fs.readFile(path, 'utf-8')
    return [content, stat]
  } catch (err) {
    return ["", null];
  }
}

export async function getFiles(dir: string) {
  try {
    const [[c1, c1Stat], [c2, c2Stat]] = await Promise.all([
      getFileContent(path.join(dir, "lockfile")),
      getFileContent(path.join(dir, "LeagueClient", "lockfile")),
    ])
    const shouldAppendGameToDir = Boolean(!c1Stat && c2Stat)
    console.log(`shouldAppendGameToDir: `, shouldAppendGameToDir)
    console.log(c1Stat?.mtimeMs, c2Stat?.mtimeMs)
    return c1 || c2
  } catch (err) {
    console.error(err)
    return ""
  }
}

export async function getAuthTask() {
  setInterval(async () => {
    const lolDir = config.get(`lolDir`, ``)
    if (!lolDir) {
      return
    }

    try {
      const content = await getFiles(lolDir)
      console.log(content)
    } catch (err) {
      console.error(err)
    }
  }, 1500)
}
