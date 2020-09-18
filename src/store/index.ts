import { AnyAction, applyMiddleware, compose, createStore } from 'redux';
import thunk, { ThunkDispatch } from 'redux-thunk';
import { TempAny } from '../temp-any';
import { appReducer } from './reducer';

const devTools = (window as TempAny).__REDUX_DEVTOOLS_EXTENSION__
  ? (window as TempAny).__REDUX_DEVTOOLS_EXTENSION__()
  : <F>(f: F) => f;

export type State = ReturnType<typeof appReducer>;
type DispatchFunctionType = ThunkDispatch<State, undefined, AnyAction>;
const enhancers = compose(applyMiddleware<DispatchFunctionType, State>(thunk), devTools);
export const store = createStore(appReducer, enhancers);
