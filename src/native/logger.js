const log = require('electron-log');
const { is } = require('electron-util');

if (!is.development) {
  Object.assign(console, log.functions);
}
