import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import type { Member } from '../../models/member';
import './social-links';
import { ThemedComponent } from '../themed-component';

/** A team member as a card: their photo, which tilts on hover, name, title and social links. */
@customElement('team-member')
export class TeamMember extends ThemedComponent {
  static override styles = css`
    :host {
      display: flex;
      align-items: center;
      gap: var(--hb-space-4);
      padding: var(--hb-space-4);
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-l);
      background-color: var(--hb-panel-background);
      backdrop-filter: var(--hb-backdrop-filter);
      box-shadow: var(--hb-shadow-card);
    }

    .avatar {
      flex: none;
      inline-size: 88px;
      block-size: 88px;
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-avatar);
      background-color: var(--hb-color-surface-container);
      object-fit: cover;
      transition: rotate var(--hb-duration-medium) var(--hb-ease-spring);
    }

    :host(:hover) .avatar {
      rotate: calc(-4deg * var(--hb-decorations, 1));
    }

    .details {
      display: grid;
      gap: var(--hb-space-1);
      min-inline-size: 0;
    }

    .name {
      margin: 0;
      padding: 0;
      font: 700 var(--hb-text-lg) / 1.2 var(--hb-font-body);
      overflow-wrap: anywhere;
    }

    .title {
      margin: 0;
      color: var(--hb-color-on-surface-variant);
      font-size: var(--hb-text-sm);
    }

    .socials {
      --hb-social-links-gap: 0;

      margin-inline-start: calc(-1 * var(--hb-space-2));
    }

    @media (prefers-reduced-motion: reduce) {
      :host(:hover) .avatar {
        rotate: none;
      }
    }
  `;

  @property({ attribute: false })
  accessor member: Member | undefined;

  override render() {
    const member = this.member;
    if (!member) return nothing;
    return html`
      <img
        class="avatar"
        src="${member.photoUrl}"
        alt=""
        loading="lazy"
        decoding="async"
        width="88"
        height="88"
      />
      <div class="details">
        <h3 class="name">${member.name}</h3>
        ${member.title ? html`<p class="title">${member.title}</p>` : nothing}
        ${
          member.socials?.length
            ? html`<social-links
                class="socials"
                owner="${member.name}"
                .socials="${member.socials}"
              ></social-links>`
            : nothing
        }
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'team-member': TeamMember;
  }
}
