import { applyMiddleware, compose, createStore } from 'redux';
import ReduxThunk from 'redux-thunk';
import { TempAny } from '../temp-any';
import { initialState } from './initial-state';
import { appReducer } from './reducer';

const devTools = (window as TempAny).__REDUX_DEVTOOLS_EXTENSION__
  ? (window as TempAny).__REDUX_DEVTOOLS_EXTENSION__()
  : (f) => f;
const enhancers = compose(applyMiddleware(ReduxThunk), devTools);

export const store = createStore(appReducer, enhancers);
export type State = typeof initialState;
