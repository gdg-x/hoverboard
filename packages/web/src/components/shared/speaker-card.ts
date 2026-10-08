import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { Speaker } from '../../models/speaker';
import { speakerPath } from '../../utils/navigation';
import { photoTransitionName, tagChipStyle } from '../../utils/styles';
import { ThemedElement } from '../themed-element';
import '../ui/hb-card';
import '../ui/hb-chip';
import './hoverboard-icon';

/** What a card shows. Previous speakers have no badges. */
export type CardSpeaker = Pick<Speaker, 'id' | 'name' | 'photoUrl' | 'company' | 'country'> &
  Partial<Pick<Speaker, 'socials' | 'badges'>>;

/**
 * A speaker as one link: photo, name, company, country and badges. In a container narrower than
 * 480px, such as a one-column list, it is a compact row.
 */
@customElement('speaker-card')
export class SpeakerCard extends ThemedElement {
  static override styles = css`
    :host {
      display: block;
    }

    hb-card {
      block-size: 100%;
    }

    .content {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: var(--hb-space-3);
      padding: var(--hb-space-5);
      text-align: center;
    }

    .photo-frame {
      position: relative;
      flex: none;
    }

    .photo {
      display: block;
      inline-size: 120px;
      block-size: 120px;
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-avatar);
      background-color: var(--hb-color-accent-1-container);
      object-fit: cover;
    }

    .social {
      position: absolute;
      inset-block-end: -4px;
      inset-inline-end: -4px;
      display: grid;
      place-items: center;
      inline-size: 32px;
      block-size: 32px;
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: 50%;
      background-color: var(--hb-color-surface-bright);
    }

    .social hoverboard-icon {
      inline-size: 16px;
      block-size: 16px;
    }

    .text {
      display: grid;
      justify-items: center;
      gap: var(--hb-space-1);
      min-inline-size: 0;
    }

    .name {
      margin: 0;
      padding: 0;
      font: 700 var(--hb-text-lg) / 1.2 var(--hb-font-display);
      overflow-wrap: anywhere;
    }

    .meta {
      margin: 0;
      color: var(--hb-color-on-surface-variant);
      font-size: var(--hb-text-sm);
    }

    .badges {
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
      gap: var(--hb-space-1);
      margin: var(--hb-space-1) 0 0;
      padding: 0;
      list-style: none;
    }

    @container (width < 480px) {
      .content {
        flex-direction: row;
        padding: var(--hb-space-3) var(--hb-space-4);
        text-align: start;
      }

      .photo {
        inline-size: 64px;
        block-size: 64px;
      }

      .social {
        inline-size: 26px;
        block-size: 26px;
      }

      .text {
        justify-items: start;
      }

      .badges {
        justify-content: flex-start;
      }
    }
  `;

  @property({ attribute: false })
  accessor speaker!: CardSpeaker;

  /** Where the card links. Defaults to the speaker's page. */
  @property()
  accessor href: string | undefined;

  /** Names the photo for the view transition to the same photo on the linked page. */
  @property({ attribute: 'transition-name' })
  accessor transitionName: string | undefined;

  override render() {
    const { speaker } = this;
    const social = speaker.socials?.[0];
    const meta = [speaker.company, speaker.country].filter(Boolean).join(' · ');
    return html`
      <hb-card href="${this.href ?? speakerPath(speaker.id)}" label="${speaker.name}">
        <div class="content">
          <div class="photo-frame">
            <img
              class="photo"
              src="${speaker.photoUrl}"
              alt=""
              loading="lazy"
              width="120"
              height="120"
              style="view-transition-name: ${
                this.transitionName ?? photoTransitionName('speaker', speaker.id)
              }"
            />
            ${
              social
                ? html`<span class="social" aria-hidden="true">
                    <hoverboard-icon name="${social.icon}"></hoverboard-icon>
                  </span>`
                : nothing
            }
          </div>
          <div class="text">
            <h3 class="name">${speaker.name}</h3>
            ${meta ? html`<p class="meta">${meta}</p>` : nothing}
            ${
              speaker.badges?.length
                ? html`<ul class="badges">
                    ${speaker.badges.map(
                      (badge) =>
                        html`<li>
                          <hb-chip
                            title="${badge.description}"
                            style="${styleMap(tagChipStyle(badge.name))}"
                          >
                            ${badge.name.toUpperCase()}
                          </hb-chip>
                        </li>`,
                    )}
                  </ul>`
                : nothing
            }
          </div>
        </div>
      </hb-card>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'speaker-card': SpeakerCard;
  }
}
