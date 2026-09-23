import { Failure, Pending, Success } from '@abraham/remotedata';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@power-elements/lazy-image';
import '../components/footer-block';
import '../components/hero/simple-hero';
import '../components/hoverboard-icon';
import '../components/markdown/short-markdown';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { selectTeamsAndMembers } from '../store/teams-members/selectors';
import { initialTeamsMembersState } from '../store/teams-members/state';
import { heroSettings, loading, team } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import { ThemedElement } from '../components/themed-element';

@customElement('team-page')
export class TeamPage extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        .description-wrapper {
          background-color: var(--secondary-background-color);
          width: 100%;
          overflow: hidden;
        }

        .team-title {
          font-size: 30px;
          line-height: 2.5;
        }

        .team-block {
          display: grid;
          grid-template-columns: 1fr;
          grid-gap: 24px;
          margin-bottom: 32px;
        }

        .member {
          padding: 16px 0;
          min-width: 300px;
          display: flex;
        }

        .photo {
          flex: none;
          --lazy-image-width: 96px;
          --lazy-image-height: 96px;
          --lazy-image-fit: cover;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
          background-color: var(--contrast-additional-background-color);
          border-radius: 50%;
          overflow: hidden;
          transform: translateZ(0);
          border: 5px solid var(--contrast-additional-background-color);
        }

        .member-details {
          color: var(--primary-text-color);
          margin-left: 16px;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: flex-start;
        }

        .name {
          padding-left: 6px;
          line-height: 1.2;
        }

        .activity {
          font-size: 16px;
          padding-left: 6px;
        }

        .social-icon {
          margin: 6px;
          width: 20px;
          height: 20px;
          padding: 6px;
          color: var(--secondary-text-color);
          transition: transform var(--animation);
        }

        .social-icon:hover {
          transform: scale(1.1);
        }

        .description-container {
          display: flex;
          justify-content: space-between;
        }

        @media (min-width: 640px) {
          .team-block {
            grid-template-columns: repeat(2, 1fr);
          }

          .member {
            padding: 32px 0;
          }
        }

        @media (min-width: 812px) {
          .photo {
            --lazy-image-width: 115px;
            --lazy-image-height: 115px;
          }
        }

        @media (min-width: 1024px) {
          .team-block {
            grid-template-columns: repeat(3, 1fr);
          }

          .photo {
            --lazy-image-width: 128px;
            --lazy-image-height: 128px;
          }
        }
      `,
    ];
  }

  private heroSettings = heroSettings.team;
  private loading = loading;
  private team = team;

  @property({ type: Object })
  teamsMembers = initialTeamsMembersState;

  get pending() {
    return this.teamsMembers instanceof Pending;
  }

  get failure() {
    return this.teamsMembers instanceof Failure;
  }

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(this.heroSettings.title, this.heroSettings.metaDescription);
  }

  override stateChanged(state: RootState) {
    this.teamsMembers = selectTeamsAndMembers(state);
  }

  override render() {
    const teams = this.teamsMembers instanceof Success ? this.teamsMembers.data : [];

    return html`
      <simple-hero page="team"></simple-hero>

      <div class="description-wrapper">
        <div class="container description-container">
          <short-markdown content=${this.team.description}></short-markdown>
        </div>
      </div>

      <div class="container">
        ${this.pending ? html`<p>${this.loading}</p>` : ''}
        ${this.failure ? html`<p>Error loading teams.</p>` : ''}
        ${teams.map(
          (team) => html`
            <div class="team-title">${team.title}</div>
            <div class="team-block">
              ${team.members.map(
                (member) => html`
                  <div class="member">
                    <lazy-image
                      class="photo"
                      src=${member.photoUrl}
                      alt=${member.name}
                    ></lazy-image>
                    <div class="member-details">
                      <h2 class="name">${member.name}</h2>
                      <div class="activity">${member.title}</div>
                      <div class="contacts">
                        ${member.socials.map(
                          (social) => html`
                            <a href=${social.link} target="_blank" rel="noopener noreferrer">
                              <hoverboard-icon
                                class="social-icon"
                                name=${social.icon}
                              ></hoverboard-icon>
                            </a>
                          `,
                        )}
                      </div>
                    </div>
                  </div>
                `,
              )}
            </div>
          `,
        )}
      </div>

      <footer-block></footer-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'team-page': TeamPage;
  }
}
