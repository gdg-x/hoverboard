import '@material/mwc-button';
import '@material/mwc-icon-button';
import '@material/mwc-snackbar';
import { html, LitElement, nothing, svg } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { Snackbar, TIMEOUT } from '../models/snackbar';
import { RootState, store } from '../store';
import { ReduxMixin } from '../store/mixin';
import { removeSnackbar } from '../store/snackbars';

/* eslint-disable max-len */
const closeIcon = svg`
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="#FFFFFF">
    <path d="M0 0h24v24H0V0z" fill="none"/>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
  </svg>
`;
/* eslint-enable max-len */

@customElement('snack-bar')
export class SnackBar extends ReduxMixin(LitElement) {
  @state()
  private state: Snackbar | undefined;
  @state()
  private connected = false;

  @query('mwc-snackbar')
  snackbar!: import('@material/mwc-snackbar').Snackbar;

  override render() {
    const action = this.state?.action
      ? html`
          <mwc-button slot="action" @click="${this.state.action.callback}">
            ${this.state.action.title}
          </mwc-button>
        `
      : nothing;

    const close = html`
      <mwc-icon-button slot="dismiss" @click="${this.removeSnackbar}">
        ${closeIcon}
      </mwc-icon-button>
    `;

    return html`
      <mwc-snackbar
        labelText="${this.state?.label ?? ''}"
        timeoutMs=${this.state?.timeout ?? TIMEOUT.DEFAULT}
        @MDCSnackbar:closed="${this.removeSnackbar}"
      >
        ${action} ${close}
      </mwc-snackbar>
    `;
  }

  override firstUpdated() {
    this.connected = true;
    if (this.state && !this.snackbar.open) {
      this.snackbar.show();
    }
  }

  override stateChanged(state: RootState) {
    this.state = state.snackbars[0];
    if (this.connected && this.state && !this.snackbar.open) {
      this.snackbar.show();
    }
  }

  private removeSnackbar() {
    if (this.state) {
      store.dispatch(removeSnackbar(this.state.id));
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'snack-bar': SnackBar;
  }
}
