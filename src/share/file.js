const fs = require('fs').promises;
const fse = require('fs-extra');
const _pick = require('lodash/pick');

export const saveToFile = async (desDir, data) => {
  try {
    const content = _pick(data, [
      'title',
      'map',
      'mode',
      'type',
      'priority',
      'sortrank',
      'blocks',
    ]);

    const file = `${desDir}/Game/Config/Champions/${data.key}/Recommended/${data.fileName}.json`;
    await fse.outputFile(file, JSON.stringify(content, null, 4));
    return true;
  } catch (error) {
    return error;
  }
};

export const removeFolderContent = async dir => {
  try {
    await fse.emptyDir(dir);
    return true;
  } catch (error) {
    return error;
  }
};

export const getLcuToken = async dirPath => {
  const dir = `${dirPath}/Game/Logs/LeagueClient Logs`;

  try {
    const files = await fs.readdir(dir);
    const latest = files
      .filter(f => f.includes(`renderer.log`))
      .sort((a, b) => a - b)
      .pop();

    const content = await fs.readFile(`${dir}/${latest}`, 'utf8');
    
    const url = content.match(/https(.*)\/index\.html/)[1];
    const token = url.match(/riot:(.*)@/)[1];
    const port = url.match(/:(\d+)/)[1];
    const urlWithAuth = `https${url}`;

    return [token, port, urlWithAuth];
  } catch (err) {
    throw new Error(err);
  }
}
