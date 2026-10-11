import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { archive } from '../../config/site';
import { ThemedComponent } from '../themed-component';

/** A band across the top of an archived edition, with a link to the current one. */
@customElement('archive-banner')
export class ArchiveBanner extends ThemedComponent {
  static override styles = css`
    :host {
      display: block;
      background-color: var(--hb-color-ink);
      color: var(--hb-color-surface);
    }

    p {
      margin: 0 auto;
      max-inline-size: var(--hb-content-max);
      padding: var(--hb-space-2) var(--hb-gutter);
    }

    a {
      color: inherit;
      font-weight: 600;
    }
  `;

  override render() {
    if (!archive) return nothing;
    const { year, current } = archive;
    return html`<p>
      ${msg(str`This is the ${year} edition.`, { id: 'shell.archive-banner.text' })}
      <a href="${current}">
        ${msg('See the current edition', { id: 'shell.archive-banner.link' })}
      </a>
    </p>`;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'archive-banner': ArchiveBanner;
  }
}
