import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import '../components/hero/hero-block';
import { heroText } from '../components/hero/hero-block';
import { PAGE_TONES } from '../components/hero/simple-hero';
import '../components/markdown/short-markdown';
import '../components/schedule/session-element';
import '../components/shared/hoverboard-icon';
import '../components/shared/previous-talks';
import '../components/shared/speaker-photo';
import '../components/ui/hb-chip';
import '../components/ui/hb-icon-button';
import '../components/ui/hb-progress';
import type { PreviousSpeaker } from '../models/previous-speaker';
import type { BuiltSpeaker } from '../schedule/build-schedule';
import { goto } from '../utils/navigation';
import { store } from '../store';
import { selectPreviousSpeaker } from '../store/previous-speakers/selectors';
import { selectSpeaker } from '../store/speakers/selectors';
import { type SpeakersState, selectSpeakersState } from '../store/schedule';
import { updateImageMetadata } from '../utils/metadata';
import { photoTransitionName, tagChipStyle } from '../utils/styles';
import { profile } from '../styles/profile';
import { fromStore } from '../controllers/from-store';
import { ThemedElement } from '../components/themed-element';

/**
 * A speaker: their photo, which moves here from their card, name, details, badges, social links
 * and bio, then their sessions and, with `previousSpeakers` on, their talks in earlier years.
 */
@customElement('speaker-page')
export class SpeakerPage extends ThemedElement {
  static override styles = [
    heroText,
    profile,
    css`
      :host {
        display: block;
        background-color: var(--hb-section-background);
        color: var(--hb-color-on-surface);
      }

      .sessions {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(min(100%, 20rem), 1fr));
        gap: var(--hb-space-4);
      }

      .sessions > li {
        display: grid;
      }
    `,
  ];

  @property({ attribute: false })
  accessor speaker: BuiltSpeaker | undefined;
  @fromStore((state) => selectSpeakersState(state))
  accessor speakers!: SpeakersState;
  @property({ attribute: false })
  accessor speakerId: string | undefined;

  private previousSpeaker: PreviousSpeaker | undefined;

  // Runs on the server too, so the page renders the speaker. Side effects wait for `updated`.
  override willUpdate(changed: PropertyValues<this>) {
    if ((changed.has('speakers') || changed.has('speakerId')) && this.isLoaded) {
      this.speaker = selectSpeaker(store.getState(), this.speakerId!);
      this.previousSpeaker = __HB_FEATURES__.previousSpeakers
        ? selectPreviousSpeaker(store.getState(), this.speakerId!)
        : undefined;
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
    const details = [job, speaker?.country, speaker?.pronouns].filter(Boolean).join(' · ');

    return html`
      <hero-block tone="${PAGE_TONES.speakers}">
        <a class="back" href="/speakers">
          <hoverboard-icon name="arrow-left"></hoverboard-icon>
          ${msg('All speakers', { id: 'pages.speaker.all-speakers' })}
        </a>
        <div class="profile">
          ${
            speaker
              ? html`<speaker-photo
                  class="photo"
                  size="l"
                  loading="eager"
                  src="${speaker.photoUrl}"
                  style="view-transition-name: ${photoTransitionName('speaker', speaker.id)}"
                ></speaker-photo>`
              : nothing
          }
          <div>
            <h1 class="hero-title">${speaker?.name ?? ''}</h1>
            ${details ? html`<p class="details">${details}</p>` : nothing}
            ${
              speaker?.badges?.length
                ? html`<ul
                    class="badges"
                    aria-label="${msg('Badges', { id: 'pages.speaker.badges' })}"
                  >
                    ${speaker.badges.map(
                      (badge) => html`
                        <li>
                          <hb-chip
                            href="${badge.link}"
                            style="${styleMap(tagChipStyle(badge.name))}"
                          >
                            ${badge.description}
                          </hb-chip>
                        </li>
                      `,
                    )}
                  </ul>`
                : nothing
            }
          </div>
        </div>
      </hero-block>

      <hb-progress ?hidden="${!!speaker}"></hb-progress>

      ${speaker ? this.renderContent(speaker) : nothing}
    `;
  }

  private renderContent(speaker: BuiltSpeaker) {
    const sessions = speaker.sessions;
    const previousTalks = Object.keys(this.previousSpeaker?.sessions ?? {}).length > 0;
    return html`
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
          sessions.length
            ? html`
                <h2 class="section-title">${msg('Sessions', { id: 'common.sessions' })}</h2>
                <ul class="sessions">
                  ${sessions.map(
                    (session) =>
                      html`<li>
                        <session-element .session="${session}"></session-element>
                      </li>`,
                  )}
                </ul>
              `
            : nothing
        }
        ${
          previousTalks
            ? html`
                <h2 class="section-title">
                  ${msg('Talks in earlier years', { id: 'pages.speaker.previous-talks' })}
                </h2>
                <previous-talks .sessions="${this.previousSpeaker!.sessions}"></previous-talks>
              `
            : nothing
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'speaker-page': SpeakerPage;
  }
}
