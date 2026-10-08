import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../components/hero/simple-hero';
import { ThemedElement } from '../components/themed-element';
import { PageMetadataController } from '../controllers/page-metadata-controller';

/** The service worker shows this page when another page is neither online nor cached. */
@customElement('offline-page')
export class OfflinePage extends ThemedElement {
  static override styles = css`
    .container {
      padding: 32px 16px;
    }
  `;

  private readonly metadata = new PageMetadataController(this, 'offline');

  override render() {
    return html`
      <simple-hero page="offline"></simple-hero>

      <div class="container">
        <p>
          ${msg(
            'You are offline and this page has not been saved yet. Pages you have visited are still available.',
            { id: 'pages.offline.message' },
          )}
        </p>
        <a href="/">${msg('Go to the home page', { id: 'pages.offline.home-link' })}</a>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'offline-page': OfflinePage;
  }
}
