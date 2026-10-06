import { css, html, LitElement } from 'lit';
import { customElement } from 'lit/decorators.js';

@customElement('text-truncate')
export class TextTruncate extends LitElement {
  static override get styles() {
    return css`
      :host {
        -webkit-box-orient: vertical;
        display: -webkit-box;
        overflow: hidden;
        -webkit-line-clamp: 3;
      }

      :host([lines='2']) {
        -webkit-line-clamp: 2;
      }

      :host([lines='3']) {
        -webkit-line-clamp: 3;
      }

      :host([lines='4']) {
        -webkit-line-clamp: 4;
      }

      :host([lines='5']) {
        -webkit-line-clamp: 5;
      }
    `;
  }

  override render() {
    return html`<slot></slot>`;
  }
}
