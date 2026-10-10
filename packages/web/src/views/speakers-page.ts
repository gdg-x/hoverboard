import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../components/hero/simple-hero';
import '../components/shared/filter-menu';
import '../components/shared/no-results';
import '../components/shared/previous-speakers-block';
import '../components/shared/speaker-card';
import '../components/ui/hb-progress';
import type { Filter } from '../models/filter';
import { type FilterGroup, FilterGroupKey } from '../models/filter-group';
import type { BuiltSpeaker } from '../schedule/build-schedule';
import { selectFilters } from '../store/filters';
import { selectFilterGroups } from '../store/sessions/selectors';
import { selectFilteredSpeakers } from '../store/speakers/selectors';
import { type SpeakersState, selectSpeakersState } from '../store/schedule';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import { fromStore } from '../controllers/from-store';
import { ThemedComponent } from '../components/themed-component';

// A stable reference, so `selectFilterGroups` stays memoized.
const SPEAKER_FILTER_GROUPS = [FilterGroupKey.tags];

/** Every speaker as a card, with filters by the tags of their sessions. */
@customElement('speakers-page')
export class SpeakersPage extends ThemedComponent {
  static override styles = [
    css`
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

      .speakers {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 15rem), 1fr));
        gap: var(--hb-space-5);
        margin: var(--hb-space-5) 0 0;
        padding: 0;
        list-style: none;
      }

      .speakers > li {
        display: grid;
      }
    `,
  ];

  private readonly metadata = new PageMetadataController(this, 'speakers');

  @fromStore((state) => selectSpeakersState(state))
  accessor speakers!: SpeakersState;
  @fromStore((state) => selectFilterGroups(state, SPEAKER_FILTER_GROUPS))
  accessor filterGroups!: FilterGroup[];
  @fromStore((state) => selectFilters(state))
  accessor selectedFilters!: Filter[];
  @fromStore((state) => selectFilteredSpeakers(state))
  accessor speakersToRender!: BuiltSpeaker[];

  override render() {
    const speakers = this.speakersToRender;
    return html`
      <simple-hero page="speakers"></simple-hero>

      <hb-progress ?hidden="${this.speakers instanceof Success}"></hb-progress>

      <div class="inner">
        <filter-menu
          .filterGroups="${this.filterGroups}"
          .selectedFilters="${this.selectedFilters}"
          .resultsCount="${speakers.length}"
        ></filter-menu>

        ${
          speakers.length === 0 && this.selectedFilters.length
            ? html`<no-results>
                ${msg('No speakers match these filters.', { id: 'pages.speakers.no-results' })}
              </no-results>`
            : html`<ul class="speakers">
                ${speakers.map(
                  (speaker) => html`<li><speaker-card .speaker="${speaker}"></speaker-card></li>`,
                )}
              </ul>`
        }
      </div>

      ${
        __HB_FEATURES__.previousSpeakers
          ? html`<previous-speakers-block></previous-speakers-block>`
          : nothing
      }
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'speakers-page': SpeakersPage;
  }
}
