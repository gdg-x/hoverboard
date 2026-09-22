import { html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { coc, heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './footer-block';
import './hero/simple-hero';
import './markdown/remote-markdown';
import { ThemedElement } from './themed-element';

@customElement('coc-page')
export class CocPage extends ThemedElement {
  private heroSettings = heroSettings.coc;

  @property()
  source = coc;

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);
  }

  override render() {
    return html`
      <simple-hero page="coc"></simple-hero>

      <remote-markdown toc path=${this.source}></remote-markdown>

      <footer-block></footer-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'coc-page': CocPage;
  }
}
