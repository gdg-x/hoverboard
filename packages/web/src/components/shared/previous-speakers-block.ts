import { Failure, Pending, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import type { PreviousSpeaker } from '../../models/previous-speaker';
import { randomOrder } from '../../utils/arrays';
import { previousSpeakerPath } from '../../utils/navigation';
import {
  type PreviousSpeakersState,
  selectPreviousSpeakersState,
} from '../../store/previous-speakers';
import './hoverboard-icon';
import '../ui/hb-button';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('previous-speakers-block')
export class PreviousSpeakersBlock extends ThemedElement {
  static override styles = css`
    :host {
      margin: 32px auto;
      text-align: center;
    }

    .speakers-wrapper {
      margin: 40px -8px 32px;
      position: relative;
      display: flex;
      flex-wrap: wrap;
      overflow: hidden;
      justify-content: center;
    }

    .speaker {
      margin: 8px;
    }

    .photo {
      --lazy-image-width: 64px;
      --lazy-image-height: 64px;
      --lazy-image-fit: cover;
      width: var(--lazy-image-width);
      height: var(--lazy-image-height);
      background-color: var(--contrast-additional-background-color);
      border-radius: 50%;
      overflow: hidden;
      transform: translateZ(0);
    }

    @media (min-width: 640px) {
      .speakers-wrapper {
        margin-right: -12px;
        margin-left: -12px;
      }

      .speaker {
        margin: 12px;
      }

      .photo {
        --lazy-image-width: 96px;
        --lazy-image-height: 96px;
      }
    }

    @media (max-width: 639px) {
      .speaker:nth-of-type(n + 9) {
        display: none;
      }
    }
  `;

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
      <div class="container">
        <h1 class="container-title">
          ${msg('Previous speakers', { id: 'shared.previous-speakers-block.title' })}
        </h1>

        <div class="speakers-wrapper">
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
          ${this.speakers.map(
            (speaker) => html`
              <a class="speaker" href="${this.previousSpeakerUrl(speaker.id)}">
                <img
                  loading="lazy"
                  decoding="async"
                  class="photo"
                  src="${speaker.photoUrl}"
                  alt="${speaker.name}"
                />
              </a>
            `,
          )}
        </div>

        <hb-button variant="text" href="/previous-speakers" trailing-icon>
          ${msg('View all', { id: 'shared.previous-speakers-block.view-all' })}
          <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
        </hb-button>
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
