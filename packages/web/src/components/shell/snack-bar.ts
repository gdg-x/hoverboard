import '@material/web/button/text-button.js';
import '@material/web/iconbutton/icon-button.js';
import { css, html, LitElement, nothing, type PropertyValues, svg } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import { type Snackbar, TIMEOUT } from '../../models/snackbar';
import { store } from '../../store';
import { removeSnackbar } from '../../store/snackbars';

const closeIcon = svg`
  <svg xmlns="http://www.w3.org/2000/svg" height="24px" viewBox="0 0 24 24" width="24px" fill="currentColor">
    <path d="M0 0h24v24H0V0z" fill="none"/>
    <path d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z"/>
  </svg>
`;

@customElement('snack-bar')
export class SnackBar extends LitElement {
  static override styles = css`
    .snackbar {
      position: fixed;
      inset: auto auto 16px 16px;
      margin: 0;
      display: flex;
      align-items: center;
      gap: 8px;
      box-sizing: border-box;
      min-width: 344px;
      max-width: calc(100vw - 32px);
      padding: 6px 8px 6px 16px;
      border: none;
      border-radius: 4px;
      background: var(--snackbar-background-color);
      color: var(--snackbar-text-color);
      font-size: 14px;
      box-shadow: var(--box-shadow);
    }

    .snackbar:popover-open {
      animation: snackbar-in 0.15s ease-out;
    }

    @keyframes snackbar-in {
      from {
        opacity: 0;
        transform: translateY(8px);
      }
    }

    @media (max-width: 599px) {
      .snackbar {
        inset: auto 0 0;
        min-width: 0;
        max-width: none;
        border-radius: 0;
      }
    }

    .label {
      flex: 1;
    }

    .action {
      --md-text-button-label-text-color: var(--light-primary-color);
      --md-text-button-hover-label-text-color: var(--light-primary-color);
      --md-text-button-focus-label-text-color: var(--light-primary-color);
      --md-text-button-pressed-label-text-color: var(--light-primary-color);
    }

    .dismiss {
      --md-icon-button-icon-color: var(--text-primary-color);
    }
  `;

  @fromStore((state) => state.snackbars[0])
  private accessor state!: Snackbar | undefined;

  @query('.snackbar')
  private accessor snackbar!: HTMLElement;

  private timeout: number | undefined;

  override render() {
    const action = this.state?.action
      ? html`
          <md-text-button class="action" @click="${this.onAction}">
            ${this.state.action.title}
          </md-text-button>
        `
      : nothing;

    return html`
      <div class="snackbar" role="status" popover="manual">
        <span class="label">${this.state?.label ?? ''}</span>
        ${action}
        <md-icon-button class="dismiss" aria-label="dismiss" @click="${this.removeSnackbar}">
          ${closeIcon}
        </md-icon-button>
      </div>
    `;
  }

  override updated(changedProperties: PropertyValues) {
    if (!changedProperties.has('state')) {
      return;
    }

    window.clearTimeout(this.timeout);
    if (this.state) {
      this.snackbar.togglePopover?.(true);
      this.timeout = window.setTimeout(
        () => this.removeSnackbar(),
        this.state.timeout ?? TIMEOUT.DEFAULT,
      );
    } else {
      this.snackbar.togglePopover?.(false);
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
