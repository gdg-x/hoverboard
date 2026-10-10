import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import { selectOnline, selectPendingCount, syncLabel } from '../../store/sync';
import '../shared/hoverboard-icon';
import { ThemedElement } from '../themed-element';

/**
 * Says when the site is offline, or syncing changes made offline. Opening it explains what works
 * offline. Nothing shows on the server or in the first render, which assume online.
 */
@customElement('sync-status')
export class SyncStatus extends ThemedElement {
  static override styles = css`
    :host {
      position: relative;
      display: inline-flex;
    }

    summary {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: var(--hb-space-1);
      min-inline-size: 40px;
      block-size: 40px;
      box-sizing: border-box;
      padding: 0 var(--hb-space-2);
      border-radius: var(--hb-radius-full);
      background-color: var(--hb-color-accent-2-container);
      color: var(--hb-color-on-accent-2-container);
      font: 600 var(--hb-text-sm) / 1 var(--hb-font-mono);
      white-space: nowrap;
      list-style: none;
      cursor: pointer;
    }

    summary::-webkit-details-marker {
      display: none;
    }

    summary:focus-visible {
      outline: 3px solid var(--hb-color-focus);
      outline-offset: 2px;
    }

    hoverboard-icon {
      inline-size: 20px;
      block-size: 20px;
    }

    /* Still read by screen readers. */
    .visually-hidden {
      position: absolute;
      inline-size: 1px;
      block-size: 1px;
      overflow: hidden;
      clip-path: inset(50%);
      white-space: nowrap;
    }

    .help {
      position: absolute;
      z-index: 10;
      inset-block-start: calc(100% + var(--hb-space-2));
      inset-inline-end: 0;
      inline-size: min(320px, 100vw - 32px);
      margin: 0;
      padding: var(--hb-space-4);
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-m);
      background-color: var(--hb-panel-background);
      color: var(--hb-color-on-surface);
      box-shadow: var(--hb-shadow-card);
      font: var(--hb-text-sm) / 1.5 var(--hb-font-body);
    }

    @media (forced-colors: active) {
      summary {
        border: 1px solid CanvasText;
      }
    }
  `;

  @fromStore(selectOnline)
  private accessor online!: boolean;
  @fromStore(selectPendingCount)
  private accessor pending!: number;

  override render() {
    const label = syncLabel(this.online, this.pending);
    if (!label) return nothing;
    return html`
      <details>
        <summary role="status" title="${label}">
          ${this.pending ? html`<span aria-hidden="true">${this.pending}</span>` : nothing}
          <hoverboard-icon name="${this.pending ? 'cloud-upload' : 'cloud-off'}"></hoverboard-icon>
          <span class="visually-hidden">${label}</span>
        </summary>
        <p class="help">
          ${msg(
            'Bookmarks, feedback and reminders you change are saved on this device, and sync when you are online. Signing in, subscribing and turning on notifications need the internet.',
            { id: 'shell.sync.help' },
          )}
        </p>
      </details>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sync-status': SyncStatus;
  }
}
