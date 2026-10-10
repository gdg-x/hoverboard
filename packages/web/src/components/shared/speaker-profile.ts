import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { PreviousSpeaker } from '../../models/previous-speaker';
import type { Speaker } from '../../models/speaker';
import { photoTransitionName, tagChipStyle } from '../../utils/styles';
import { heroText } from '../hero/hero-block';
import '../ui/hb-chip';
import './speaker-photo';
import { ThemedComponent } from '../themed-component';

/** What the top of a speaker's page shows. Previous speakers have no pronouns or badges. */
export type ProfileSpeaker = Pick<
  PreviousSpeaker,
  'id' | 'name' | 'photoUrl' | 'title' | 'company' | 'country'
> &
  Partial<Pick<Speaker, 'pronouns' | 'badges'>>;

/**
 * The top of a speaker's page: their photo, which moves here from their card, name, job, country,
 * pronouns and badges. Without a speaker yet, an empty heading holds the place.
 */
@customElement('speaker-profile')
export class SpeakerProfile extends ThemedComponent {
  static override styles = [
    heroText,
    css`
      :host {
        display: flex;
        flex-wrap: wrap;
        align-items: center;
        gap: var(--hb-space-5) var(--hb-space-6);
      }

      .text {
        flex: 1 1 18rem;
        min-inline-size: 0;
      }

      .details {
        margin: var(--hb-space-3) 0 0;
        font-size: var(--hb-text-lg);
      }

      .badges {
        display: flex;
        flex-wrap: wrap;
        gap: var(--hb-space-2);
        margin: var(--hb-space-4) 0 0;
        padding: 0;
        list-style: none;
      }
    `,
  ];

  @property({ attribute: false })
  accessor speaker: ProfileSpeaker | undefined;
  /** Which list the speaker is from, to name the photo like the card it came from. */
  @property()
  accessor kind: 'speaker' | 'previous-speaker' = 'speaker';

  override render() {
    const speaker = this.speaker;
    const job = [speaker?.title, speaker?.company].filter(Boolean).join(', ');
    const details = [job, speaker?.country, speaker?.pronouns].filter(Boolean).join(' · ');

    return html`
      ${
        speaker
          ? html`<speaker-photo
              class="photo"
              size="l"
              loading="eager"
              src="${speaker.photoUrl}"
              style="view-transition-name: ${photoTransitionName(this.kind, speaker.id)}"
            ></speaker-photo>`
          : nothing
      }
      <div class="text">
        <h1 class="hero-title">${speaker?.name ?? ''}</h1>
        ${details ? html`<p class="details">${details}</p>` : nothing}
        ${
          speaker?.badges?.length
            ? html`<ul class="badges" aria-label="${msg('Badges', { id: 'pages.speaker.badges' })}">
                ${speaker.badges.map(
                  (badge) => html`
                    <li>
                      <hb-chip href="${badge.link}" style="${styleMap(tagChipStyle(badge.name))}">
                        ${badge.description}
                      </hb-chip>
                    </li>
                  `,
                )}
              </ul>`
            : nothing
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'speaker-profile': SpeakerProfile;
  }
}
