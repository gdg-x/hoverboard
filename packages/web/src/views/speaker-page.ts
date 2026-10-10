import { Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '../components/hero/hero-block';
import { heroText } from '../components/hero/hero-block';
import { PAGE_TONES } from '../components/hero/simple-hero';
import '../components/markdown/short-markdown';
import '../components/schedule/session-card';
import '../components/shared/hoverboard-icon';
import '../components/shared/previous-talks';
import '../components/shared/social-links';
import '../components/shared/speaker-profile';
import '../components/ui/hb-progress';
import type { PreviousSpeaker } from '../models/previous-speaker';
import type { BuiltSpeaker } from '../schedule/build-schedule';
import { goto } from '../utils/navigation';
import { store } from '../store';
import { selectPreviousSpeaker } from '../store/previous-speakers/selectors';
import { selectSpeaker } from '../store/speakers/selectors';
import { type SpeakersState, selectSpeakersState } from '../store/schedule';
import { updateImageMetadata } from '../utils/metadata';
import { profile } from '../styles/profile';
import { fromStore } from '../controllers/from-store';
import { ThemedComponent } from '../components/themed-component';

/**
 * A speaker: their photo, which moves here from their card, name, details, badges, social links
 * and bio, then their sessions and, with `previousSpeakers` on, their talks in earlier years.
 */
@customElement('speaker-page')
export class SpeakerPage extends ThemedComponent {
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

    return html`
      <hero-block tone="${PAGE_TONES.speakers}">
        <a class="back" href="/speakers">
          <hoverboard-icon name="arrow-left"></hoverboard-icon>
          ${msg('All speakers', { id: 'pages.speaker.all-speakers' })}
        </a>
        <speaker-profile kind="speaker" .speaker="${speaker}"></speaker-profile>
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
        <social-links
          variant="tonal"
          label="${msg('Social links', { id: 'pages.speaker.socials' })}"
          .socials="${speaker.socials ?? []}"
        ></social-links>

        <short-markdown class="bio" .content="${speaker.bio ?? ''}"></short-markdown>

        ${
          sessions.length
            ? html`
                <h2 class="section-title">${msg('Sessions', { id: 'common.sessions' })}</h2>
                <ul class="sessions">
                  ${sessions.map(
                    (session) =>
                      html`<li>
                        <session-card .session="${session}"></session-card>
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
