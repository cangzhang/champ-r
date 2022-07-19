import React from 'react';
import { Emitter } from 'mitt';

import { IState } from '@interfaces/commonTypes';

interface IContext {
  store: IState;
  dispatch: React.Dispatch<any>;
  emitter: Emitter<any>,
}

const state: IContext = {
  store: {} as IState,
  dispatch: () => null,
  emitter: {} as Emitter<any>,
};

const AppContext = React.createContext(state);

export default AppContext;
