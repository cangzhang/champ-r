import log from 'electron-log';

const isDev = process.env.PORT || process.env.IS_DEV_MODE === `true`;

export const initLogger = () => {
  if (!isDev) {
    Object.assign(console, log.functions);
  }
};
