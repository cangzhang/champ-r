import { IFetchStatus } from '@interfaces/commonTypes';

export const Actions = {
  ADD_FETCHING: 'LIST.ADD_FETCHING',
  REMOVE_FETCHING: 'LIST.REMOVE_FETCHING',
  ADD_FETCHED: 'LIST.ADD_FETCHED',
  REMOVE_FETCHED: 'LIST.REMOVE_FETCHED',

  INIT_REDUCER: 'APP.INIT_REDUCER',
  UPDATE_LOL_VERSION: 'APP.UPDATE_LOL_VERSION',

  UPDATE_ITEM_MAP: 'APP.UPDATE_ITEM_MAP',

  PREPARE_REIMPORT: 'APP.PREPARE_REIMPORT',

  FETCHING_SOURCE: 'FETCHING_SOURCE',
  FETCH_SOURCE_DONE: 'FETCH_SOURCE_DONE',

  UPDATE_SELECT_SOURCES: `UPDATE_SELECT_SOURCES`,
  UPDATE_APP_CONFIG: `UPDATE_APP_CONFIG`,

  SET_IMPORTER_INSTANCE: `SET_IMPORTER_INSTANCE`,
  IMPORT_BUILD_FAILED: `IMPORT_PAGE.FAILED`,
  IMPORT_BUILD_SUCCEED: `IMPORT_PAGE.SUCCEED`,
  SET_DATA_SOURCE_VERSION: `HOME.SET_DATA_SOURCE_VERSION`,
  CLEAR_FETCH: `IMPORT.CLEAR_FETCH`,
};

export const setLolVersion = (ver: string) => ({
  type: Actions.UPDATE_LOL_VERSION,
  payload: ver,
});

export const addFetching = (data: IFetchStatus) => ({
  type: Actions.ADD_FETCHING,
  payload: data,
});

export const addFetched = (data: IFetchStatus) => ({
  type: Actions.ADD_FETCHED,
  payload: data,
});

export const clearFetch = () => ({
  type: Actions.CLEAR_FETCH,
});

export const updateItemMap = (data: any) => ({
  type: Actions.UPDATE_ITEM_MAP,
  payload: data,
});

export const prepareReimport = () => ({
  type: Actions.PREPARE_REIMPORT,
});

export const updateFetchingSource = (source: string[]) => ({
  type: Actions.FETCHING_SOURCE,
  payload: source,
});

export const fetchSourceDone = (source: string) => ({
  type: Actions.FETCH_SOURCE_DONE,
  payload: source,
});

export const updateConfig = (k: string, v: any) => ({
  type: Actions.UPDATE_APP_CONFIG,
  payload: [k, v],
});

export const setImporterInstance = (k: string, v: string) => ({
  type: Actions.SET_IMPORTER_INSTANCE,
  payload: [k, v],
});

export const importBuildSucceed = (v: string) => ({
  type: Actions.IMPORT_BUILD_SUCCEED,
  payload: v,
});

export const importBuildFailed = (v: string) => ({
  type: Actions.IMPORT_BUILD_FAILED,
  payload: v,
});

export const updateDataSourceVersion = (k: string, v: string) => ({
  type: Actions.SET_DATA_SOURCE_VERSION,
  payload: [k, v],
});
