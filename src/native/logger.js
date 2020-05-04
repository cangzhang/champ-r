const log = require('electron-log');
const isDev = require('electron-is-dev');

if (!isDev) {
  Object.assign(console, log.functions);
}
