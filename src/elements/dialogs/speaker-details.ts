import '@polymer/app-layout/app-header-layout/app-header-layout';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/iron-icon';
import { IronOverlayBehavior } from '@polymer/iron-overlay-behavior';
import '@polymer/marked-element';
import { html, PolymerElement } from '@polymer/polymer';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class';
import 'plastic-image';
import { ReduxMixin } from '../../mixins/redux-mixin';
import { SessionsHoC } from '../../mixins/sessions-hoc';
import { dialogsActions } from '../../redux/actions';
import { DIALOGS } from '../../redux/constants';
import { State } from '../../redux/store';
import { getVariableColor, isEmpty } from '../../utils/functions';
import '../shared-styles';
import '../text-truncate';
import './dialog-styles';

class SpeakerDetails extends SessionsHoC(
  ReduxMixin(mixinBehaviors([IronOverlayBehavior], PolymerElement))
) {
  static get template() {
    return html`
      <style include="shared-styles dialog-styles flex flex-alignment positioning">
        .photo {
          margin-right: 16px;
          width: 96px;
          height: 96px;
          border-radius: 50%;
          background-color: var(--contrast-additional-background-color);
          transform: translateZ(0);
          flex-shrink: 0;
        }

        .subtitle {
          font-size: 16px;
          color: var(--secondary-text-color);
        }

        .badge:not(:last-of-type)::after {
          margin-left: -4px;
          content: ',';
        }

        .action {
          color: var(--secondary-text-color);
        }

        .section {
          cursor: pointer;
        }

        .tags {
          margin-top: 8px;
        }

        .star-rating {
          display: inline-block;
          vertical-align: middle;
        }
      </style>

      <polymer-helmet
        title="[[speaker.name]] | {$ title $}"
        description="[[speaker.bio]]"
        image="[[speaker.photoUrl]]"
        active="[[opened]]"
        label1="{$ position $}"
        data1="[[speaker.title]], [[speaker.company]]"
        label2="{$ country $}"
        data2="[[speaker.country]]"
      ></polymer-helmet>

      <app-header-layout has-scrolling-region>
        <app-header slot="header" class="header" fixed="[[viewport.isTabletPlus]]">
          <iron-icon
            class="close-icon"
            icon="hoverboard:[[_getCloseBtnIcon(viewport.isLaptopPlus)]]"
            on-click="_close"
          ></iron-icon>

          <app-toolbar>
            <div class="dialog-container header-content" layout horizontal center>
              <plastic-image
                class="photo"
                srcset="[[speaker.photoUrl]]"
                sizing="cover"
                lazy-load
                preload
                fade
              ></plastic-image>
              <div>
                <h2 class="name" flex>[[speaker.name]]</h2>
                <div class="subtitle">[[subtitle]]</div>
              </div>
            </div>
          </app-toolbar>
        </app-header>

        <div class="dialog-container content">
          <h3 class="meta-info">[[companyInfo]]</h3>
          <h3 class="meta-info" hidden$="[[isEmpty(speaker.badges)]]">
            <template is="dom-repeat" items="[[speaker.badges]]" as="badge">
              <a
                class="badge"
                href$="[[badge.link]]"
                target="_blank"
                rel="noopener noreferrer"
                title$="[[badge.description]]"
              >
                [[badge.description]]
              </a>
            </template>
          </h3>

          <marked-element class="description" markdown="[[speaker.bio]]">
            <div slot="markdown-html"></div>
          </marked-element>

          <div class="actions" layout horizontal>
            <template is="dom-repeat" items="[[speaker.socials]]" as="social">
              <a class="action" href$="[[social.link]]" target="_blank" rel="noopener noreferrer">
                <iron-icon icon="hoverboard:[[social.icon]]"></iron-icon>
              </a>
            </template>
          </div>

          <div class="additional-sections" hidden$="[[!speaker.sessions.length]]">
            <h3>{$ speakerDetails.sessions $}</h3>

            <template is="dom-repeat" items="[[speaker.sessions]]" as="session">
              <div on-click="_openSession" session-id$="[[session.id]]" class="section">
                <div layout horizontal center>
                  <div class="section-details" flex>
                    <div class="section-primary-text">[[session.title]]</div>
                    <div class="section-secondary-text" hidden$="[[!session.dateReadable]]">
                      [[session.dateReadable]], [[session.startTime]] - [[session.endTime]]
                    </div>
                    <div class="section-secondary-text" hidden$="[[!session.track.title]]">
                      [[session.track.title]]
                    </div>
                    <div class="tags" hidden$="[[!session.tags.length]]">
                      <template is="dom-repeat" items="[[session.tags]]" as="tag">
                        <span class="tag" style$="color: [[getVariableColor(tag)]]">[[tag]]</span>
                      </template>
                    </div>
                  </div>
                </div>
              </div>
            </template>
          </div>
        </div>
      </app-header-layout>
    `;
  }

  static get is() {
    return 'speaker-details';
  }

  static get properties() {
    return {
      ...super.properties,
      speaker: {
        type: Object,
      },
      viewport: {
        type: Object,
      },
      disabledSchedule: {
        type: Boolean,
        value: () => JSON.parse('{$ disabledSchedule $}'),
      },
      companyInfo: {
        type: String,
        computed: '_computeCompanyInfo(speaker.title, speaker.company)',
      },
      subtitle: {
        type: String,
        computed: '_computeJoin(speaker.country, speaker.pronouns)',
      },
    };
  }

  stateChanged(state: State) {
    super.stateChanged(state);
    this.setProperties({
      viewport: state.ui.viewport,
    });
  }

  constructor() {
    super();
    this.addEventListener('iron-overlay-canceled', this._close);
  }

  _close() {
    dialogsActions.closeDialog(DIALOGS.SPEAKER);
    history.back();
  }

  _openSession(e) {
    const sessionId = e.currentTarget.getAttribute('session-id');
    const sessionData = this.sessionsMap[sessionId];

    if (!sessionData) return;
    dialogsActions.openDialog(DIALOGS.SESSION, sessionData);
    dialogsActions.closeDialog(DIALOGS.SPEAKER);
  }

  _getCloseBtnIcon(isLaptopViewport) {
    return isLaptopViewport ? 'close' : 'arrow-left';
  }

  _computeCompanyInfo(title, company) {
    return [title, company].filter(Boolean).join(', ');
  }

  _computeJoin(...values) {
    return values.filter(Boolean).join(' • ');
  }

  isEmpty(array) {
    return isEmpty(array);
  }

  getVariableColor(value: string) {
    return getVariableColor(this, value);
  }
}

window.customElements.define(SpeakerDetails.is, SpeakerDetails);
