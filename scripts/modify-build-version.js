const path = require('path');
const fs = require('fs');
const util = require('util');

const pkgFile = path.resolve(__dirname, '../package.json');

const readFile = util.promisify(fs.readFile);
const writeFile = util.promisify(fs.writeFile);

(async function () {
  const data = await readFile(pkgFile)
  const content = JSON.parse(data.toString())
  content.version += `-test`
  await writeFile(pkgFile, JSON.stringify(content, null, 2))
})()
