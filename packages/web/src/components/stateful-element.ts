import { ReduxMixin } from '../store/mixin';
import { ThemedElement } from './themed-element';

/** A themed element that receives Redux state through `stateChanged`. */
export class StatefulElement extends ReduxMixin(ThemedElement) {}
