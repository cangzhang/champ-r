import React from 'react';

const state = {
	store: null,
	dispatch: null,
};

const AppContext = React.createContext(state);

export default AppContext;
