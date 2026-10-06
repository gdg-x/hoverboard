import '@material/web/button/text-button.js';
import { Failure, Pending } from '@abraham/remotedata';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import type { PreviousSpeaker } from '../../models/previous-speaker';
import { router } from '../../router';
import { selectRandomPreviousSpeakers } from '../../store/previous-speakers/selectors';
import {
  type PreviousSpeakersState,
  selectPreviousSpeakersState,
} from '../../store/previous-speakers';
import { loading, previousSpeakersBlock } from '../../utils/data';
import './hoverboard-icon';
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
  `;

  @fromStore((state) => selectPreviousSpeakersState(state))
  previousSpeakers!: PreviousSpeakersState;

  @fromStore((state) => selectRandomPreviousSpeakers(state))
  speakers!: PreviousSpeaker[];

  override render() {
    return html`
      <div class="container">
        <h1 class="container-title">${previousSpeakersBlock.title}</h1>

        <div class="speakers-wrapper">
          ${this.pending ? html`<p>${loading}</p>` : ''}
          ${this.failure ? html`<p>Error loading previous speakers.</p>` : ''}
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

        <a href="${previousSpeakersBlock.callToAction.link}">
          <md-text-button class="animated icon-right" trailing-icon>
            ${previousSpeakersBlock.callToAction.label}
            <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
          </md-text-button>
        </a>
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
    return router.urlForName('previous-speaker-page', { id });
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'previous-speakers-block': PreviousSpeakersBlock;
  }
}
