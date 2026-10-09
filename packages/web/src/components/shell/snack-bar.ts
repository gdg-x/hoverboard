import { msg } from '@lit/localize';
import { html, nothing, type PropertyValues, svg } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import { type Snackbar, TIMEOUT } from '../../models/snackbar';
import { store } from '../../store';
import { removeSnackbar } from '../../store/snackbars';
import { ThemedElement } from '../themed-element';
import '../ui/hb-button';
import '../ui/hb-icon-button';
import '../ui/hb-toast';

const closeIcon = svg`
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor">
    <path d="M0 0h24v24H0V0z" fill="none"/>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
  </svg>
`;

@customElement('snack-bar')
export class SnackBar extends ThemedElement {
  @fromStore((state) => state.snackbars[0])
  private accessor state!: Snackbar | undefined;

  private timeout: number | undefined;

  override render() {
    const action = this.state?.action
      ? html`
          <hb-button slot="action" variant="text" class="action" @click="${this.onAction}">
            ${this.state.action.title}
          </hb-button>
        `
      : nothing;

    return html`
      <hb-toast ?open="${!!this.state}">
        <span class="label">${this.state?.label ?? ''}</span>
        ${action}
        <hb-icon-button
          slot="action"
          class="dismiss"
          label="${msg('Dismiss', { id: 'shell.snack-bar.dismiss' })}"
          @click="${this.removeSnackbar}"
        >
          ${closeIcon}
        </hb-icon-button>
      </hb-toast>
    `;
  }

  override updated(changedProperties: PropertyValues) {
    if (!changedProperties.has('state')) {
      return;
    }

    window.clearTimeout(this.timeout);
    if (this.state) {
      this.timeout = window.setTimeout(
        () => this.removeSnackbar(),
        this.state.timeout ?? TIMEOUT.DEFAULT,
      );
    }
  }

  override disconnectedCallback() {
    window.clearTimeout(this.timeout);
    super.disconnectedCallback();
  }

  private onAction() {
    this.state?.action?.callback();
    this.removeSnackbar();
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
