import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { Speaker } from '../../models/speaker';
import { speakerPath } from '../../utils/navigation';
import { photoTransitionName, tagColor } from '../../utils/styles';
import { ThemedElement } from '../themed-element';
import '../ui/hb-card';
import './hoverboard-icon';
import './speaker-photo';

/** Badges with an icon for the photo. */
const AFFILIATIONS = ['gde', 'gdg', 'google', 'wtm'];
/** Where each badge sits on the photo's edge, clockwise from the right. */
const ANGLES = [45, 10, 80, -25];

/** What a card shows. Previous speakers have no badges. */
export type CardSpeaker = Pick<Speaker, 'id' | 'name' | 'photoUrl' | 'company' | 'country'> &
  Partial<Pick<Speaker, 'socials' | 'badges'>>;

/**
 * A speaker as one link: photo with their GDE, GDG, Google and WTM badges, name, company and
 * country. In a container narrower than 480px, such as a one-column list, it is a compact row.
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
      --photo-size: 120px;
      --badge-size: 32px;

      position: relative;
      flex: none;
    }

    .photo {
      --hb-speaker-photo-size: var(--photo-size);
      --hb-speaker-photo-background: var(--hb-color-accent-1-container);
    }

    .affiliation {
      --radius: calc(var(--photo-size) * 0.57);

      position: absolute;
      inset-block-start: calc(50% + sin(var(--angle)) * var(--radius) - var(--badge-size) / 2);
      inset-inline-start: calc(50% + cos(var(--angle)) * var(--radius) - var(--badge-size) / 2);
      display: grid;
      place-items: center;
      inline-size: var(--badge-size);
      block-size: var(--badge-size);
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: 50%;
      background-color: var(--hb-color-surface-bright);
    }

    .affiliation hoverboard-icon {
      inline-size: 55%;
      block-size: 55%;
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

    @container (width < 480px) {
      .content {
        flex-direction: row;
        padding: var(--hb-space-3) var(--hb-space-4);
        text-align: start;
      }

      .photo-frame {
        --photo-size: 64px;
        --badge-size: 26px;
      }

      .text {
        justify-items: start;
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
    const affiliations = (speaker.badges ?? [])
      .filter((badge) => AFFILIATIONS.includes(badge.name))
      .slice(0, ANGLES.length);
    const meta = [speaker.company, speaker.country].filter(Boolean).join(' · ');
    return html`
      <hb-card href="${this.href ?? speakerPath(speaker.id)}" label="${speaker.name}">
        <div class="content">
          <div class="photo-frame">
            <speaker-photo
              class="photo"
              size="m"
              src="${speaker.photoUrl}"
              style="view-transition-name: ${
                this.transitionName ?? photoTransitionName('speaker', speaker.id)
              }"
            ></speaker-photo>
            ${affiliations.map(
              (badge, index) =>
                html`<span
                  class="affiliation"
                  role="img"
                  aria-label="${badge.description || badge.name.toUpperCase()}"
                  title="${badge.description || badge.name.toUpperCase()}"
                  style="${styleMap({ '--angle': `${ANGLES[index]}deg` })}"
                >
                  <hoverboard-icon
                    name="${badge.name}"
                    style="color: ${tagColor(badge.name)}"
                  ></hoverboard-icon>
                </span>`,
            )}
          </div>
          <div class="text">
            <h3 class="name">${speaker.name}</h3>
            ${meta ? html`<p class="meta">${meta}</p>` : nothing}
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
