import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { Badge } from '../../models/badge';
import { tagChipStyle } from '../../utils/styles';
import '../ui/hb-chip';
import { ThemedComponent } from '../themed-component';

/** A speaker's badges, such as GDE, as chips in each badge's color that link to its program. */
@customElement('speaker-badges')
export class SpeakerBadges extends ThemedComponent {
  static override styles = css`
    :host {
      display: block;
    }

    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--hb-space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }
  `;

  @property({ attribute: false })
  accessor badges: Badge[] = [];

  override render() {
    if (!this.badges.length) return nothing;
    return html`
      <ul aria-label="${msg('Badges', { id: 'pages.speaker.badges' })}">
        ${this.badges.map(
          (badge) => html`
            <li>
              <hb-chip href="${badge.link}" style="${styleMap(tagChipStyle(badge.name))}">
                ${badge.description}
              </hb-chip>
            </li>
          `,
        )}
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'speaker-badges': SpeakerBadges;
  }
}
