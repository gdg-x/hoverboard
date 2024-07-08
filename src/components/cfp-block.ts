// TODO: enable imports
// import '@polymer/iron-icon';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { cfpBlock } from '../utils/data';
// TODO: enable imports
// import '../utils/icons';
import { ThemedElement } from './themed-element';

@customElement('cfp-block')
export class CfpBlock extends ThemedElement {
  static override get styles() {
    return [
      ...super.styles,
      css`
        .container {
          padding-top: 64px;
          padding-bottom: 64px;
          background-color: var(--default-primary-color);
          color: var(--text-primary-color);
        }

        paper-button {
          margin-top: 16px;
          color: var(--text-primary-color);
        }
      `,
    ];
  }

  override render() {
    return html`
      <div class="container">
        <div class="container-narrow">
          <h1 class="container-title">${cfpBlock.open.title}</h1>
          <p>${cfpBlock.open.description}</p>
          <a href="${cfpBlock.open.callToAction.link}" target="_blank" rel="noopener noreferrer">
            <paper-button class="cta-button animated icon-right">
              <span>${cfpBlock.open.callToAction.label}</span>
              <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
            </paper-button>
          </a>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'cfp-block': CfpBlock;
  }
}
