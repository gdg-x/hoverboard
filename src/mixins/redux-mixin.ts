import { connect } from 'pwa-helpers';
import { store } from '../store/store';

export const ReduxMixin = connect(store);
