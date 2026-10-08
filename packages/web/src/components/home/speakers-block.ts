import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import type { Speaker } from '../../models/speaker';
import { type SpeakersState, selectSpeakersState } from '../../store/speakers';
import { band } from '../../styles/band';
import { randomOrder } from '../../utils/arrays';
import '../shared/hoverboard-icon';
import '../shared/speaker-card';
import { ThemedElement } from '../themed-element';
import '../ui/hb-button';

/** Up to four featured speakers, and a link to all of them. */
@customElement('speakers-block')
export class SpeakersBlock extends ThemedElement {
  static override styles = [
    band,
    css`
      .speakers {
        container-type: inline-size;
      }

      .grid {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(14rem, 1fr));
        gap: var(--hb-space-5);
      }

      @container (width < 480px) {
        .grid {
          grid-template-columns: minmax(0, 1fr);
          gap: var(--hb-space-3);
        }
      }

      speaker-card {
        block-size: 100%;
      }
    `,
  ];

  @fromStore((state) => selectSpeakersState(state))
  accessor speakers!: SpeakersState;

  // The first render follows the stored order, as on the server, so hydration matches.
  @state()
  private accessor shuffled = false;

  override firstUpdated() {
    this.shuffled = true;
  }

  override render() {
    return html`
      <div class="inner">
        <div class="band-header">
          <h2 class="band-title">${msg('Speakers', { id: 'home.speakers-block.title' })}</h2>
          <hb-button variant="outlined" class="cta-button" href="/speakers" trailing-icon>
            ${msg('View all speakers', { id: 'home.speakers-block.cta' })}
            <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
          </hb-button>
        </div>

        <div class="speakers">
          <ul class="grid plain">
            ${this.featuredSpeakers.map(
              (speaker) => html`<li><speaker-card .speaker="${speaker}"></speaker-card></li>`,
            )}
          </ul>
        </div>
      </div>
    `;
  }

  get featuredSpeakers(): Speaker[] {
    if (this.speakers instanceof Success) {
      const { data } = this.speakers;
      const filteredSpeakers = data.filter((speaker) => speaker.featured);
      const speakers = filteredSpeakers.length ? filteredSpeakers : data;
      return (this.shuffled ? randomOrder(speakers) : speakers).slice(0, 4);
    }

    return [];
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'speakers-block': SpeakersBlock;
  }
}
