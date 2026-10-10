import { Failure, Pending, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import '../components/hero/simple-hero';
import '../components/markdown/short-markdown';
import '../components/shared/hoverboard-icon';
import '../components/ui/hb-icon-button';
import { selectTeamsAndMembers } from '../store/teams-members/selectors';
import { initialTeamsMembersState } from '../store/teams-members/state';
import { aboutOrganizerBlock, team } from '../config/site';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import { fromStore } from '../controllers/from-store';
import { ThemedComponent } from '../components/themed-component';

/** The team: the organizers' photo and story, then each subteam and its members. */
@customElement('team-page')
export class TeamPage extends ThemedComponent {
  static override styles = css`
    :host {
      display: block;
      background-color: var(--hb-section-background);
      color: var(--hb-color-on-surface);
    }

    /* Content-box, so the text column lines up with the hero's. */
    .inner {
      box-sizing: content-box;
      max-inline-size: var(--hb-content-max);
      margin-inline: auto;
      padding: var(--hb-space-6) var(--hb-gutter) var(--hb-space-9);
      container-type: inline-size;
    }

    .intro {
      display: grid;
      gap: var(--hb-space-6);
      align-items: start;
    }

    .team-photo {
      display: block;
      inline-size: 100%;
      aspect-ratio: 16 / 9;
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-l);
      background-color: var(--hb-color-surface-container);
      box-shadow: var(--hb-shadow-card);
      object-fit: cover;
    }

    .description {
      display: block;
      max-inline-size: var(--hb-prose-max);
      font-size: var(--hb-text-lg);
      line-height: 1.6;
    }

    .team-title {
      margin: var(--hb-space-8) 0 var(--hb-space-4);
      padding: 0;
      font: 800 var(--hb-text-3xl) / 1.1 var(--hb-font-display);
    }

    ul {
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .members {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(min(100%, 17rem), 1fr));
      gap: var(--hb-space-5);
    }

    .member {
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

    .member:hover .avatar {
      rotate: calc(-4deg * var(--hb-decorations, 1));
    }

    .member-details {
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
      display: flex;
      flex-wrap: wrap;
      margin-inline-start: calc(-1 * var(--hb-space-2));
    }

    @container (width >= 800px) {
      .intro.with-photo {
        grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr);
      }
    }

    @media (prefers-reduced-motion: reduce) {
      .member:hover .avatar {
        rotate: none;
      }
    }
  `;

  private readonly metadata = new PageMetadataController(this, 'team');

  @fromStore((state) => selectTeamsAndMembers(state))
  accessor teamsMembers!: typeof initialTeamsMembersState;

  override render() {
    const teams = this.teamsMembers instanceof Success ? this.teamsMembers.data : [];
    const photo = aboutOrganizerBlock.image;

    return html`
      <simple-hero page="team"></simple-hero>

      <div class="inner">
        <div class="intro ${photo ? 'with-photo' : ''}">
          ${
            photo
              ? html`<img
                  class="team-photo"
                  src="${photo}"
                  alt="${msg('The team', { id: 'pages.team.photo-alt' })}"
                  loading="lazy"
                />`
              : nothing
          }
          <short-markdown class="description" .content="${team.description}"></short-markdown>
        </div>

        ${this.teamsMembers instanceof Pending ? html`<p>${msg('Loading...', { id: 'common.loading' })}</p>` : nothing}
        ${
          this.teamsMembers instanceof Failure
            ? html`<p>${msg('Error loading teams.', { id: 'pages.team.error' })}</p>`
            : nothing
        }
        ${teams.map(
          (team) => html`
            <section aria-labelledby="team-${team.id}">
              <h2 class="team-title" id="team-${team.id}">${team.title}</h2>
              <ul class="members">
                ${team.members.map(
                  (member) => html`
                    <li class="member">
                      <img
                        class="avatar"
                        src="${member.photoUrl}"
                        alt=""
                        loading="lazy"
                        decoding="async"
                        width="88"
                        height="88"
                      />
                      <div class="member-details">
                        <h3 class="name">${member.name}</h3>
                        ${member.title ? html`<p class="title">${member.title}</p>` : nothing}
                        ${
                          member.socials?.length
                            ? html`<ul class="socials">
                                ${member.socials.map(
                                  (social) => html`
                                    <li>
                                      <hb-icon-button
                                        href="${social.link}"
                                        target="_blank"
                                        label="${`${social.name}: ${member.name}`}"
                                      >
                                        <hoverboard-icon name="${social.icon}"></hoverboard-icon>
                                      </hb-icon-button>
                                    </li>
                                  `,
                                )}
                              </ul>`
                            : nothing
                        }
                      </div>
                    </li>
                  `,
                )}
              </ul>
            </section>
          `,
        )}
      </div>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'team-page': TeamPage;
  }
}
