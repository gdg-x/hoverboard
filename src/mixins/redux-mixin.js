import { createMixin } from 'polymer-redux';
import { store } from '../redux/store.js';

export const ReduxMixin = createMixin(store);
