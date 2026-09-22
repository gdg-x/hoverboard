import '@power-elements/lazy-image';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './footer-block';
import './hero/simple-hero';
import { ThemedElement } from './themed-element';

@customElement('not-found-page')
export class NotFoundPage extends ThemedElement {
  static override get styles() {
    return [
      ...super.styles,
      css`
        .not-found-image {
          --lazy-image-width: calc(100% - 94px);
          --lazy-image-height: 400px;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
          margin: 48px;
        }
      `,
    ];
  }

  private heroSettings = heroSettings.notFound;

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);
  }

  override render() {
    return html`
      <simple-hero page="notFound"></simple-hero>

      <lazy-image
        class="not-found-image"
        src="../../images/not-found.svg"
        alt=${this.heroSettings.title}
      ></lazy-image>

      <footer-block></footer-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'not-found-page': NotFoundPage;
  }
}
