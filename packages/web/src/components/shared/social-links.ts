import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Social } from '../../models/social';
import '../ui/hb-icon-button';
import './hoverboard-icon';
import { ThemedComponent } from '../themed-component';

/** A person's social profiles as a row of icon links, which open in a new tab. */
@customElement('social-links')
export class SocialLinks extends ThemedComponent {
  static override styles = css`
    :host {
      display: block;
    }

    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--hb-social-links-gap, var(--hb-space-2));
      margin: 0;
      padding: 0;
      list-style: none;
    }
  `;

  @property({ attribute: false })
  accessor socials: Social[] = [];
  /** Whose profiles they are, for each link's name when several people share a page. */
  @property()
  accessor owner: string | undefined;
  /** The list's accessible name. */
  @property()
  accessor label: string | undefined;
  @property()
  accessor variant: 'standard' | 'tonal' = 'standard';

  override render() {
    if (!this.socials.length) return nothing;
    return html`
      <ul aria-label="${this.label ?? nothing}">
        ${this.socials.map(
          (social) => html`
            <li>
              <hb-icon-button
                variant="${this.variant}"
                href="${social.link}"
                target="_blank"
                label="${this.owner ? `${social.name}: ${this.owner}` : social.name}"
              >
                <hoverboard-icon name="${social.icon}"></hoverboard-icon>
              </hb-icon-button>
            </li>
          `,
        )}
      </ul>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'social-links': SocialLinks;
  }
}
