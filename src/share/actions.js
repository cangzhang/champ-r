export const Actions = {
	ADD_FETCHING: `LIST.ADD_FETCHING`,
	REMOVE_FETCHING: `LIST.REMOVE_FETCHING`,
	ADD_FETCHED: `LIST.ADD_FETCHED`,
	REMOVE_FETCHED: `LIST.REMOVE_FETCHED`,

	INIT_REDUCER: `APP.INIT_REDUCER`,
	UPDATE_LOL_VERSION: `APP.UPDATE_LOL_VERSION`,

	UPDATE_ITEM_MAP: `APP.UPDATE_ITEM_MAP`,
};

export const setLolVersion = ver => ({
	type: Actions.UPDATE_LOL_VERSION,
	payload: ver,
});

export const addFetching = data => ({
		type: Actions.ADD_FETCHING,
		payload: data,
	}
);

export const addFetched = data => ({
		type: Actions.ADD_FETCHED,
		payload: data,
	}
);

export const updateItemMap = data => ({
	type: Actions.UPDATE_ITEM_MAP,
	payload: data,
});
