import { Pending, Success } from '@abraham/remotedata';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../components/hero/simple-hero';
import '../components/shared/speaker-card';
import '../components/ui/hb-progress';
import type { PreviousSpeaker } from '../models/previous-speaker';
import { previousSpeakerPath } from '../utils/navigation';
import {
  type PreviousSpeakersState,
  selectPreviousSpeakersState,
} from '../store/previous-speakers';
import { photoTransitionName } from '../utils/styles';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import { fromStore } from '../controllers/from-store';
import { ThemedComponent } from '../components/themed-component';

/** Each year with talks, newest first, and its speakers in their order. */
export const speakersByYear = (speakers: PreviousSpeaker[]) => {
  const years = [
    ...new Set(speakers.flatMap((speaker) => Object.keys(speaker.sessions ?? {}))),
  ].sort((a, b) => Number(b) - Number(a));
  return years.map((year) => ({
    year,
    speakers: speakers.filter((speaker) => year in (speaker.sessions ?? {})),
  }));
};

/** Speakers from earlier years, grouped by the year they spoke, under sticky year headings. */
@customElement('previous-speakers-page')
export class PreviousSpeakersPage extends ThemedComponent {
  static override styles = css`
    :host {
      display: block;
      background-color: var(--hb-section-background);
      color: var(--hb-color-on-surface);
    }

    /* Content-box, so the text column lines up with the hero's. */
    .inner {
      box-sizing: content-box;
      max-inline-size: var(--hb-content-max);
      margin-inline: auto;
      padding: var(--hb-space-5) var(--hb-gutter) var(--hb-space-9);
    }

    .year {
      position: sticky;
      z-index: 2;
      inset-block-start: var(--hb-header-height);
      margin: var(--hb-space-6) calc(-1 * var(--hb-space-3)) var(--hb-space-4);
      padding: var(--hb-space-2) var(--hb-space-3);
      background-color: var(--hb-bar-background);
      backdrop-filter: var(--hb-backdrop-filter);
      /* Covers the cards that scroll under the header's margin too. */
      box-shadow: 0 calc(-1 * var(--hb-space-5)) 0 0 var(--hb-bar-background);
      font: 800 var(--hb-text-3xl) / 1.1 var(--hb-font-display);
    }

    ul {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
      gap: var(--hb-space-5);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    li {
      display: grid;
    }
  `;

  @fromStore((state) => selectPreviousSpeakersState(state))
  accessor previousSpeakers!: PreviousSpeakersState;

  private readonly metadata = new PageMetadataController(this, 'previousSpeakers');

  override render() {
    const pending = this.previousSpeakers instanceof Pending;
    const groups = speakersByYear(
      this.previousSpeakers instanceof Success ? this.previousSpeakers.data : [],
    );
    // A speaker in several years gets the transition name once, as names must be unique.
    const named = new Set<string>();

    return html`
      <simple-hero page="previousSpeakers"></simple-hero>

      <hb-progress ?hidden="${!pending}"></hb-progress>

      <div class="inner">
        ${groups.map(
          ({ year, speakers }) => html`
            <section aria-labelledby="year-${year}">
              <h2 class="year" id="year-${year}">${year}</h2>
              <ul>
                ${speakers.map((speaker) => {
                  const first = !named.has(speaker.id);
                  named.add(speaker.id);
                  return html`<li>
                    <speaker-card
                      .speaker="${speaker}"
                      href="${previousSpeakerPath(speaker.id)}"
                      transition-name="${first ? photoTransitionName('previous-speaker', speaker.id) : 'none'}"
                    ></speaker-card>
                  </li>`;
                })}
              </ul>
            </section>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'previous-speakers-page': PreviousSpeakersPage;
  }
}
