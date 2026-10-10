import { Failure, Pending, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { PreviousSpeaker } from '../../models/previous-speaker';
import { randomOrder } from '../../utils/arrays';
import { previousSpeakerPath } from '../../utils/navigation';
import { band } from '../../styles/band';
import {
  type PreviousSpeakersState,
  selectPreviousSpeakersState,
} from '../../store/previous-speakers';
import './hoverboard-icon';
import './speaker-photo';
import '../ui/hb-button';
import { fromStore } from '../../controllers/from-store';
import { ThemedComponent } from '../themed-component';

@customElement('previous-speakers-block')
export class PreviousSpeakersBlock extends ThemedComponent {
  static override styles = [
    band,
    css`
      :host {
        background-color: var(--hb-color-surface-container);
        color: var(--hb-color-on-surface);
      }

      .speakers {
        display: flex;
        flex-wrap: wrap;
        gap: var(--hb-space-3);
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .speaker {
        display: block;
        border-radius: var(--hb-radius-avatar);
        transition: translate var(--hb-duration-short) var(--hb-ease-spring);
      }

      .speaker:hover {
        translate: 0 -3px;
      }

      .speaker:focus-visible {
        outline: 3px solid var(--hb-color-focus);
        outline-offset: 2px;
      }

      .photo {
        --hb-speaker-photo-background: var(--hb-color-surface-bright);
      }

      @container (width < 480px) {
        .speakers li:nth-of-type(n + 9) {
          display: none;
        }
      }

      @media (prefers-reduced-motion: reduce) {
        .speaker:hover {
          translate: none;
        }
      }
    `,
  ];

  @fromStore((state) => selectPreviousSpeakersState(state))
  accessor previousSpeakers!: PreviousSpeakersState;

  // The first render follows the stored order, as on the server, so hydration matches.
  @state()
  private accessor shuffled = false;

  override firstUpdated() {
    this.shuffled = true;
  }

  private get speakers(): PreviousSpeaker[] {
    if (!(this.previousSpeakers instanceof Success)) return [];
    const { data } = this.previousSpeakers;
    return (this.shuffled ? randomOrder(data) : data).slice(0, 14);
  }

  override render() {
    return html`
      <div class="inner">
        <div class="band-header">
          <h2 class="band-title">
            ${msg('Previous speakers', { id: 'shared.previous-speakers-block.title' })}
          </h2>
          <hb-button variant="outlined" href="/previous-speakers" trailing-icon>
            ${msg('View all', { id: 'shared.previous-speakers-block.view-all' })}
            <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
          </hb-button>
        </div>

        ${this.pending ? html`<p>${msg('Loading...', { id: 'common.loading' })}</p>` : ''}
        ${
          this.failure
            ? html`<p>
                ${msg('Error loading previous speakers.', {
                  id: 'shared.previous-speakers-block.error',
                })}
              </p>`
            : ''
        }
        <ul class="speakers">
          ${this.speakers.map(
            (speaker) => html`
              <li>
                <a class="speaker" href="${this.previousSpeakerUrl(speaker.id)}">
                  <speaker-photo
                    class="photo"
                    size="s"
                    src="${speaker.photoUrl}"
                    alt="${speaker.name}"
                  ></speaker-photo>
                </a>
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }

  private get pending() {
    return this.previousSpeakers instanceof Pending;
  }

  private get failure() {
    return this.previousSpeakers instanceof Failure;
  }

  private previousSpeakerUrl(id: string) {
    return previousSpeakerPath(id);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'previous-speakers-block': PreviousSpeakersBlock;
  }
}
