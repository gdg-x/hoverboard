import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/hero/hero-block';
import { heroText } from '../components/hero/hero-block';
import { PAGE_TONES } from '../components/hero/simple-hero';
import '../components/markdown/short-markdown';
import '../components/shared/hoverboard-icon';
import '../components/shared/previous-speakers-block';
import '../components/shared/previous-talks';
import '../components/shared/speaker-photo';
import '../components/ui/hb-icon-button';
import '../components/ui/hb-progress';
import type { PreviousSpeaker } from '../models/previous-speaker';
import { goto } from '../utils/navigation';
import { store } from '../store';
import { selectPreviousSpeaker } from '../store/previous-speakers/selectors';
import {
  type PreviousSpeakersState,
  selectPreviousSpeakersState,
} from '../store/previous-speakers';
import { updateImageMetadata } from '../utils/metadata';
import { photoTransitionName } from '../utils/styles';
import { profile } from '../styles/profile';
import { fromStore } from '../controllers/from-store';
import { ThemedElement } from '../components/themed-element';

/** A speaker from earlier years: their photo, details, social links, bio and talks. */
@customElement('previous-speaker-page')
export class PreviousSpeakerPage extends ThemedElement {
  static override styles = [
    heroText,
    profile,
    css`
      :host {
        display: block;
        background-color: var(--hb-section-background);
        color: var(--hb-color-on-surface);
      }
    `,
  ];

  @property({ attribute: false })
  accessor speaker: PreviousSpeaker | undefined;
  @fromStore((state) => selectPreviousSpeakersState(state))
  accessor speakers!: PreviousSpeakersState;
  @property({ attribute: false })
  accessor speakerId: string | undefined;

  // Runs on the server too, so the page renders the speaker. Side effects wait for `updated`.
  override willUpdate(changed: PropertyValues<this>) {
    if ((changed.has('speakers') || changed.has('speakerId')) && this.isLoaded) {
      this.speaker = selectPreviousSpeaker(store.getState(), this.speakerId!);
    }
  }

  override updated(changed: PropertyValues<this>) {
    if ((changed.has('speakers') || changed.has('speakerId')) && this.isLoaded) {
      if (!this.speaker) {
        goto('/404');
      } else {
        updateImageMetadata(this.speaker.name, this.speaker.bio, {
          image: this.speaker.photoUrl,
          imageAlt: this.speaker.name,
        });
      }
    }
  }

  private get isLoaded() {
    return !!this.speakerId && this.speakers instanceof Success;
  }

  override render() {
    const speaker = this.speaker;
    const job = [speaker?.title, speaker?.company].filter(Boolean).join(', ');
    const details = [job, speaker?.country].filter(Boolean).join(' · ');

    return html`
      <hero-block tone="${PAGE_TONES.previousSpeakers}">
        <a class="back" href="/previous-speakers">
          <hoverboard-icon name="arrow-left"></hoverboard-icon>
          ${msg('All previous speakers', { id: 'pages.previous-speaker.all' })}
        </a>
        <div class="profile">
          ${
            speaker
              ? html`<speaker-photo
                  class="photo"
                  size="l"
                  loading="eager"
                  src="${speaker.photoUrl}"
                  style="view-transition-name: ${photoTransitionName('previous-speaker', speaker.id)}"
                ></speaker-photo>`
              : nothing
          }
          <div>
            <h1 class="hero-title">${speaker?.name ?? ''}</h1>
            ${details ? html`<p class="details">${details}</p>` : nothing}
          </div>
        </div>
      </hero-block>

      <hb-progress ?hidden="${!!speaker}"></hb-progress>

      ${
        speaker
          ? html`
              <div class="inner">
                ${
                  speaker.socials?.length
                    ? html`<ul aria-label="${msg('Social links', { id: 'pages.speaker.socials' })}">
                        ${speaker.socials.map(
                          (social) => html`
                            <li>
                              <hb-icon-button
                                variant="tonal"
                                href="${social.link}"
                                target="_blank"
                                label="${social.name}"
                              >
                                <hoverboard-icon name="${social.icon}"></hoverboard-icon>
                              </hb-icon-button>
                            </li>
                          `,
                        )}
                      </ul>`
                    : nothing
                }
                <short-markdown class="bio" .content="${speaker.bio ?? ''}"></short-markdown>
                ${
                  Object.keys(speaker.sessions ?? {}).length
                    ? html`<h2 class="section-title">
                          ${msg('Talks', { id: 'pages.previous-speaker.talks' })}
                        </h2>
                        <previous-talks .sessions="${speaker.sessions}"></previous-talks>`
                    : nothing
                }
              </div>
            `
          : nothing
      }

      <previous-speakers-block></previous-speakers-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'previous-speaker-page': PreviousSpeakerPage;
  }
}
