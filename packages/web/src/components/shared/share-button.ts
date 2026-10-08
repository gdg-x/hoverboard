import { msg } from '@lit/localize';
import '@material/web/button/outlined-button.js';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { ThemedElement } from '../themed-element';
import './hoverboard-icon';

@customElement('share-button')
export class ShareButton extends ThemedElement {
  static override styles = css`
    :host {
      display: inline-block;
    }
  `;

  // `url` defaults to the current page.
  @property({ type: Object })
  accessor data: ShareData | undefined;

  private share = async () => {
    try {
      await navigator.share({ url: window.location.href, ...this.data });
    } catch (error) {
      // Dismissing the share sheet rejects with AbortError.
      if (!(error instanceof DOMException && error.name === 'AbortError')) {
        throw error;
      }
    }
  };

  override render() {
    if (typeof navigator.share !== 'function') {
      return nothing;
    }

    return html`
      <md-outlined-button @click="${this.share}">
        <hoverboard-icon slot="icon" name="share"></hoverboard-icon>
        ${msg('Share', { id: 'shared.share-button.label', desc: 'Shares the session.' })}
      </md-outlined-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'share-button': ShareButton;
  }
}
