import { createMixin } from 'polymer-redux';
import { store } from '../redux/store';

export const ReduxMixin = createMixin(store);
