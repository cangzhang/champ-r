import produce from 'immer';

import { Actions } from 'src/share/actions';

export * from 'src/share/actions';

export const initialState = {
	fetching: [],
	fetched: [],
	version: null,
	itemMap: null,
};

export const init = payload => payload;

export default produce((draft, action) => {
	const { type, payload } = action;
	switch (type) {
		case Actions.UPDATE_LOL_VERSION: {
			draft.version = payload;
			break;
		}
		case Actions.ADD_FETCHING: {
			draft.fetching.push(payload);
			// draft = draft.fetching.sort((a, b) => a.localeCompare(b));
			break;
		}
		case Actions.ADD_FETCHED: {
			const idx = draft.fetching.findIndex(i => i.$identity === payload.$identity);
			draft.fetching.splice(idx, 1);
			draft.fetched.push(payload);
			// draft = draft.fetched.sort((a, b) => a.key.localeCompare(b.key));
			break;
		}
		case Actions.UPDATE_ITEM_MAP:
			draft.itemMap = payload;
			break;
		case Actions.INIT_REDUCER:
			draft = init(payload);
			break;
		case Actions.PREPARE_REIMPORT:
			draft.fetched = [];
			draft.fetching = [];
			break;
		default:
			return draft;
	}
});
