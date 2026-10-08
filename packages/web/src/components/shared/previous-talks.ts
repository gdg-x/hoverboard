import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { PreviousSessionWithYear } from '../../models/previous-session';
import type { PreviousSpeaker } from '../../models/previous-speaker';
import { tagChipStyle } from '../../utils/styles';
import { ThemedElement } from '../themed-element';
import './hoverboard-icon';
import '../ui/hb-button';
import '../ui/hb-chip';
import '../ui/hb-sticker';

/** A previous speaker's talks, newest year first, with their videos and slides. */
export const talksByYear = (sessions: PreviousSpeaker['sessions']): PreviousSessionWithYear[] =>
  Object.entries(sessions ?? {})
    .flatMap(([year, talks]) => talks.map((talk) => ({ ...talk, year })))
    .sort((a, b) => Number(b.year) - Number(a.year));

@customElement('previous-talks')
export class PreviousTalks extends ThemedElement {
  static override styles = css`
    :host {
      display: block;
      container-type: inline-size;
    }

    ul {
      display: grid;
      gap: var(--hb-space-4);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .talk {
      display: grid;
      gap: var(--hb-space-3);
      padding: var(--hb-space-5);
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-m);
      background-color: var(--hb-color-surface-bright);
      color: var(--hb-color-on-surface);
      box-shadow: var(--hb-shadow-card);
    }

    hb-sticker {
      justify-self: start;
    }

    .title {
      margin: 0;
      padding: 0;
      font: 700 var(--hb-text-lg) / 1.3 var(--hb-font-body);
      overflow-wrap: anywhere;
    }

    .row {
      display: flex;
      flex-wrap: wrap;
      gap: var(--hb-space-2);
    }

    @container (width >= 720px) {
      ul {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }
    }
  `;

  @property({ attribute: false })
  accessor sessions: PreviousSpeaker['sessions'] = {};

  override render() {
    return html`
      <ul>
        ${talksByYear(this.sessions).map(
          (talk) => html`
            <li class="talk">
              <hb-sticker tilt="-2">${talk.year}</hb-sticker>
              <h3 class="title">${talk.title}</h3>
              ${
                talk.tags?.length
                  ? html`<ul
                      class="row"
                      aria-label="${msg('Tags', { id: 'shared.filter-menu.tags' })}"
                    >
                      ${talk.tags.map(
                        (tag) =>
                          html`<li>
                            <hb-chip style="${styleMap(tagChipStyle(tag))}">${tag}</hb-chip>
                          </li>`,
                      )}
                    </ul>`
                  : nothing
              }
              ${
                talk.videoId || talk.presentation
                  ? html`<div class="row">
                      ${
                        talk.videoId
                          ? html`<hb-button
                              variant="outlined"
                              href="https://www.youtube.com/watch?v=${talk.videoId}"
                              target="_blank"
                            >
                              <hoverboard-icon slot="icon" name="video"></hoverboard-icon>
                              ${msg('View video', { id: 'common.view-video' })}
                            </hb-button>`
                          : nothing
                      }
                      ${
                        talk.presentation
                          ? html`<hb-button
                              variant="outlined"
                              href="${talk.presentation}"
                              target="_blank"
                            >
                              <hoverboard-icon slot="icon" name="presentation"></hoverboard-icon>
                              ${msg('View presentation', { id: 'common.view-presentation' })}
                            </hb-button>`
                          : nothing
                      }
                    </div>`
                  : nothing
              }
            </li>
          `,
        )}
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'previous-talks': PreviousTalks;
  }
}
