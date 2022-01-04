import { Failure, Pending } from '@abraham/remotedata';
import { computed, customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/marked-element';
import '@polymer/paper-icon-button';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import '../elements/shared-styles';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState } from '../store';
import { selectTeamsAndMembers } from '../store/teams-members/selectors';
import { initialTeamsMembersState } from '../store/teams-members/state';

@customElement('team-page')
export class TeamPage extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: block;
        }

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
        }

        .photo {
          flex: none;
          width: 96px;
          height: 96px;
          background-color: var(--contrast-additional-background-color);
          border-radius: 50%;
          overflow: hidden;
          transform: translateZ(0);
          border-radius: 50%;
          border: 5px solid var(--contrast-additional-background-color);
        }

        .member-details {
          color: var(--primary-text-color);
          margin-left: 16px;
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
          --paper-icon-button: {
            padding: 6px;
            width: 32px;
            height: 32px;
          }

          color: var(--secondary-text-color);
          transition: transform var(--animation);
        }

        .social-icon:hover {
          transform: scale(1.1);
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
            width: 115px;
            height: 115px;
          }
        }

        @media (min-width: 1024px) {
          .team-block {
            grid-template-columns: repeat(3, 1fr);
          }

          .photo {
            width: 128px;
            height: 128px;
          }
        }
      </style>

      <polymer-helmet
        title="{$ heroSettings.team.title $} | {$ title $}"
        description="{$ heroSettings.team.metaDescription $}"
      ></polymer-helmet>

      <hero-block
        background-image="{$ heroSettings.team.background.image $}"
        background-color="{$ heroSettings.team.background.color $}"
        font-color="{$ heroSettings.team.fontColor $}"
      >
        <div class="hero-title">{$ heroSettings.team.title $}</div>
        <p class="hero-description">{$ heroSettings.team.description $}</p>
      </hero-block>

      <div class="description-wrapper">
        <div class="container" layout horizontal justified>
          <marked-element class="description" markdown="{$ team.description $}">
            <div slot="markdown-html"></div>
          </marked-element>
        </div>
      </div>

      <div class="container">
        <template is="dom-if" if="[[pending]]">
          <p>Loading...</p>
        </template>

        <template is="dom-if" if="[[failure]]">
          <p>Error loading teams.</p>
        </template>

        <template is="dom-repeat" items="[[teamsMembers.data]]" as="team">
          <div class="team-title">[[team.title]]</div>

          <div class="team-block">
            <template is="dom-repeat" items="[[team.members]]" as="member">
              <div class="member" layout horizontal>
                <plastic-image
                  class="photo"
                  srcset="[[member.photoUrl]]"
                  sizing="cover"
                  lazy-load
                  preload
                  fade
                >
                </plastic-image>

                <div class="member-details" layout vertical center-justified start>
                  <h2 class="name">[[member.name]]</h2>
                  <div class="activity">[[member.title]]</div>
                  <div class="contacts">
                    <template is="dom-repeat" items="[[member.socials]]" as="social">
                      <a href$="[[social.link]]" target="_blank" rel="noopener noreferrer">
                        <paper-icon-button
                          class="social-icon"
                          icon="hoverboard:{{social.icon}}"
                        ></paper-icon-button>
                      </a>
                    </template>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </template>
      </div>

      <footer-block></footer-block>
    `;
  }

  @property({ type: Object })
  teamsMembers = initialTeamsMembersState;

  @computed('teamsMembers')
  get pending() {
    return this.teamsMembers instanceof Pending;
  }

  @computed('teamsMembers')
  get failure() {
    return this.teamsMembers instanceof Failure;
  }

  override stateChanged(state: RootState) {
    this.teamsMembers = selectTeamsAndMembers(state);
  }
}
