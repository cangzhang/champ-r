import produce from 'immer';

export const initialState = {
	fetching: [],
	fetched: [],
};

export const Actions = {
	ADD_FETCHING: `LIST.ADD_FETCHING`,
	REMOVE_FETCHING: `LIST.REMOVE_FETCHING`,
	ADD_FETCHED: `LIST.ADD_FETCHED`,
	REMOVE_FETCHED: `LIST.REMOVE_FETCHED`,
	INIT_REDUCER: `LIST.INIT_REDUCER`,
};

export const init = payload => payload;

export default produce((draft, action) => {
	const { type, payload } = action;
	switch (type) {
		case Actions.ADD_FETCHING: {
			draft.fetching.push(payload);
			break;
		}
		case Actions.ADD_FETCHED: {
			const target = `${ payload.key }-${ payload.position }`;
			const idx = draft.fetching.findIndex(i => i.toLowerCase() === target.toLowerCase());
			draft.fetching.splice(idx, 1);
			draft.fetched.push(payload);
			break;
		}
		case Actions.INIT_REDUCER:
			draft = init(payload);
			break;
		default:
			return draft;
	}
});
