import { applyMiddleware, compose, createStore } from 'redux/es/redux.mjs';
import ReduxThunk from 'redux-thunk';
import { appReducer } from './reducer.js';

export const store = createStore(
    appReducer,
    compose(
        applyMiddleware(ReduxThunk),
        window.__REDUX_DEVTOOLS_EXTENSION__ ? window.__REDUX_DEVTOOLS_EXTENSION__() : (f) => f,
    ),
);
