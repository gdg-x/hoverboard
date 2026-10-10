import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../components/hero/simple-hero';
import '../components/ui/hb-button';
import { illustration, illustrationStyles } from '../illustrations/illustration';
import offline from '../illustrations/offline.svg?raw';
import { pageInner } from '../styles/page';
import { ThemedComponent } from '../components/themed-component';
import { PageMetadataController } from '../controllers/page-metadata-controller';

/** The service worker shows this page when another page is neither online nor cached. */
@customElement('offline-page')
export class OfflinePage extends ThemedComponent {
  static override styles = [
    pageInner,
    illustrationStyles,
    css`
      .art {
        max-inline-size: 18rem;
        margin-block-end: var(--hb-space-6);
      }

      .inner > p,
      li {
        max-inline-size: var(--hb-prose-max);
        font-size: var(--hb-text-lg);
      }

      .inner > p {
        margin: 0;
      }

      h2 {
        margin: var(--hb-space-6) 0 var(--hb-space-3);
        padding: 0;
        font: 800 var(--hb-text-2xl) / 1.2 var(--hb-font-display);
      }

      ul {
        margin: 0 0 var(--hb-space-6);
        padding-inline-start: var(--hb-space-6);
      }

      li + li {
        margin-block-start: var(--hb-space-2);
      }
    `,
  ];

  private readonly metadata = new PageMetadataController(this, 'offline');

  override render() {
    return html`
      <simple-hero page="offline"></simple-hero>

      <div class="inner">
        ${illustration(offline, 'art')}
        <p>
          ${msg('You are offline, and this page was not saved on this device yet.', {
            id: 'pages.offline.not-saved',
          })}
        </p>
        <h2>${msg('What works offline', { id: 'pages.offline.works-title' })}</h2>
        <ul>
          <li>${msg('Pages you have visited before', { id: 'pages.offline.visited' })}</li>
          ${
            __HB_FEATURES__.mySchedule
              ? html`<li>
                  ${msg('Your saved sessions, in My Schedule', {
                    id: 'pages.offline.saved',
                  })}
                </li>`
              : nothing
          }
        </ul>
        <hb-button href="/"
          >${msg('Go to the home page', { id: 'pages.offline.home-link' })}</hb-button
        >
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'offline-page': OfflinePage;
  }
}
