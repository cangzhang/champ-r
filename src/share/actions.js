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
};

export const setLolVersion = (ver) => ({
  type: Actions.UPDATE_LOL_VERSION,
  payload: ver,
});

export const addFetching = (data) => ({
  type: Actions.ADD_FETCHING,
  payload: data,
});

export const addFetched = (data) => ({
  type: Actions.ADD_FETCHED,
  payload: data,
});

export const updateItemMap = (data) => ({
  type: Actions.UPDATE_ITEM_MAP,
  payload: data,
});

export const prepareReimport = () => ({
  type: Actions.PREPARE_REIMPORT,
});

export const updateFetchingSource = (source) => ({
  type: Actions.FETCHING_SOURCE,
  payload: source,
});

export const fetchSourceDone = (source) => ({
  type: Actions.FETCH_SOURCE_DONE,
  payload: source,
});

export const updateConfig = (k, v) => ({
  type: Actions.UPDATE_APP_CONFIG,
  payload: [k, v],
});

export const setImporterInstance = (k, v) => ({
  type: Actions.SET_IMPORTER_INSTANCE,
  payload: [k, v],
});
