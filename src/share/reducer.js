import produce from 'immer';

import { Actions } from 'src/share/actions';

export * from 'src/share/actions';

export const initialState = {
	fetchingSources: [],
	fetchedSources: [],
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
			break;
		}
		case Actions.ADD_FETCHED: {
			draft.fetching = draft.fetching.filter(i => i.$identity !== payload.$identity);
			draft.fetched.push(payload);
			break;
		}
		case Actions.FETCHING_SOURCE: {
			draft.fetchingSources = payload;
			break;
		}
		case Actions.FETCH_SOURCE_DONE: {
			draft.fetchingSources = draft.fetchingSources.filter(i => i !== payload);
			draft.fetchedSources.push(payload);
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
			draft.fetchingSources = [];
			draft.fetchedSources = [];
			break;
		default:
			return draft;
	}
});
