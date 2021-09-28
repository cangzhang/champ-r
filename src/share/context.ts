import React from 'react';

import { IState } from '@interfaces/commonTypes';

interface IContext {
  store: IState;
  dispatch: React.Dispatch<any>;
}

const state: IContext = {
  store: {} as IState,
  dispatch: () => null,
};

const AppContext = React.createContext(state);

export default AppContext;
