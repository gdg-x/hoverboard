import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import '../components/hero/simple-hero';
import '../components/ui/hb-button';
import { illustration, illustrationStyles } from '../illustrations/illustration';
import notFound from '../illustrations/not-found.svg?raw';
import { pageInner } from '../styles/page';
import { ThemedElement } from '../components/themed-element';

/** A missing page: a drawing, a joke, and the way home and to the schedule. */
@customElement('not-found-page')
export class NotFoundPage extends ThemedElement {
  static override styles = [
    pageInner,
    illustrationStyles,
    css`
      .inner {
        display: grid;
        align-items: center;
        gap: var(--hb-space-7);
        container-type: inline-size;
      }

      .art {
        max-inline-size: 24rem;
      }

      .joke {
        margin: 0 0 var(--hb-space-3);
        font: 800 var(--hb-text-3xl) / 1.15 var(--hb-font-display);
        text-wrap: balance;
      }

      .text p {
        max-inline-size: var(--hb-prose-max);
        font-size: var(--hb-text-lg);
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--hb-space-3);
        margin-block-start: var(--hb-space-5);
      }

      @media (min-width: 800px) {
        .inner {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
        }
      }
    `,
  ];

  private readonly metadata = new PageMetadataController(this, 'notFound');

  override render() {
    return html`
      <simple-hero page="notFound"></simple-hero>

      <div class="inner">
        ${illustration(notFound, 'art')}
        <div class="text">
          <p class="joke">
            ${msg('This session was moved to another room.', { id: 'pages.not-found.joke' })}
          </p>
          <p>
            ${msg(
              'The page you are looking for is not here. It may have moved, or the link is wrong.',
              {
                id: 'pages.not-found.message',
              },
            )}
          </p>
          <div class="actions">
            <hb-button href="/">
              ${msg('Go to the home page', { id: 'pages.offline.home-link' })}
            </hb-button>
            ${
              __HB_FEATURES__.schedule
                ? html`<hb-button variant="outlined" href="/schedule">
                    ${msg('See the schedule', { id: 'pages.not-found.schedule-link' })}
                  </hb-button>`
                : nothing
            }
          </div>
        </div>
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'not-found-page': NotFoundPage;
  }
}
