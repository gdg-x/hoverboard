import '@polymer/app-layout/app-header-layout/app-header-layout';
import '@polymer/app-layout/app-toolbar/app-toolbar';
import '@polymer/iron-icon';
import { IronOverlayBehavior } from '@polymer/iron-overlay-behavior';
import '@polymer/marked-element';
import { html, PolymerElement } from '@polymer/polymer';
import { mixinBehaviors } from '@polymer/polymer/lib/legacy/class';
import 'plastic-image';
import { ReduxMixin } from '../../mixins/redux-mixin';
import { dialogsActions, uiActions } from '../../redux/actions';
import { DIALOGS } from '../../redux/constants';
import { State } from '../../redux/store';
import { getVariableColor } from '../../utils/functions';
import '../shared-styles';
import '../text-truncate';
import './dialog-styles';

class PreviousSpeakerDetails extends ReduxMixin(
  mixinBehaviors([IronOverlayBehavior], PolymerElement)
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

        .action {
          color: var(--secondary-text-color);
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
              <h2 class="name" flex>[[speaker.name]]</h2>
            </div>
          </app-toolbar>
        </app-header>

        <div class="dialog-container content">
          <h3 class="meta-info">[[speaker.country]]</h3>
          <h3 class="meta-info">[[speaker.title]], [[speaker.company]]</h3>

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

          <div class="additional-sections" hidden$="[[!speaker.sessions]]">
            <h3>{$ speakerDetails.sessions $}</h3>

            <template is="dom-repeat" items="[[_getSessions(speaker.sessions)]]" as="session">
              <div layout horizontal center>
                <div class="section" flex>
                  <div class="section-primary-text">[[session.title]]</div>
                  <div class="section-secondary-text">
                    {$ speakers.previousYear $}: [[session.year]]
                  </div>
                  <div class="tags" hidden$="[[!session.tags.length]]">
                    <template is="dom-repeat" items="[[session.tags]]" as="tag">
                      <span class="tag" style$="color: [[getVariableColor(tag)]]">[[tag]]</span>
                    </template>
                  </div>
                  <div class="actions" layout horizontal>
                    <div
                      class="action"
                      hidden$="[[!session.videoId]]"
                      on-click="_openVideo"
                      layout
                      horizontal
                      center
                    >
                      <iron-icon icon="hoverboard:video"></iron-icon>
                      <span>{$ sessionDetails.viewVideo $}</span>
                    </div>
                    <a
                      class="action"
                      href$="[[session.presentation]]"
                      hidden$="[[!session.presentation]]"
                      target="_blank"
                      rel="noopener noreferrer"
                      ga-on="click"
                      ga-event-category="previous speaker"
                      ga-event-action="open video"
                      ga-event-label$="[[session.title]]"
                      layout
                      horizontal
                      center
                    >
                      <iron-icon icon="hoverboard:presentation"></iron-icon>
                      <span>{$ sessionDetails.viewPresentation $}</span>
                    </a>
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
    return 'previous-speaker-details';
  }

  static get properties() {
    return {
      speaker: {
        type: Object,
      },
      viewport: {
        type: Object,
      },
    };
  }

  stateChanged(state: State) {
    this.setProperties({
      viewport: state.ui.viewport,
    });
  }

  constructor() {
    super();
    this.addEventListener('iron-overlay-canceled', this._close);
  }

  _close() {
    dialogsActions.closeDialog(DIALOGS.PREVIOUS_SPEAKER);
  }

  _getCloseBtnIcon(isLaptopViewport) {
    return isLaptopViewport ? 'close' : 'arrow-left';
  }

  _getSessions(sessions) {
    return (
      sessions &&
      Object.keys(sessions)
        .reduce((aggregator, year) => {
          return aggregator.concat(
            sessions[year].map((session) => Object.assign({}, session, { year }))
          );
        }, [])
        .sort((a, b) => b.year - a.year)
    );
  }

  _openVideo(event) {
    event.model.session &&
      uiActions.toggleVideoDialog({
        title: event.model.session.title,
        youtubeId: event.model.session.videoId,
        disableControls: true,
        opened: true,
      });
  }

  getVariableColor(value) {
    return getVariableColor(this, value);
  }
}

window.customElements.define(PreviousSpeakerDetails.is, PreviousSpeakerDetails);
