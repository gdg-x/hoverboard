import '@polymer/paper-input/paper-input.js';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin.js';
import { subscribeActions } from '../redux/actions.js';
import './hoverboard-icons.js';
import './shared-styles.js';

class SubscribeFormFooter extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
    <style include="shared-styles flex flex-alignment positioning">
      :host {
        --paper-input-container-color: var(--footer-text-color);
        --paper-input-container-focus-color: var(--default-primary-color);
        --paper-input-container-input-color: var(--footer-text-color);
      }

      paper-input {
        padding-bottom: 0;
      }

      paper-input,
      .form-content {
        width: 100%;
      }

      paper-input-container input,
      paper-input-container label {
        font-size: 14px;
      }

      iron-icon {
        margin-bottom: 5px;
      }

      paper-button {
        margin-top: 8px;
        color: var(--secondary-text-color);
      }

      paper-button:hover {
        cursor: pointer;
      }

      paper-button[disabled] {
        background: none;
        padding-right: 0;
      }

    </style>

    <div class="form-content" layout vertical center>
      <paper-input
        id="emailInput"
        on-touchend="_focus"
        label="{$ subscribeBlock.yourEmail $}"
        value="{{email}}"
        required
        auto-validate$="[[validate]]"
        error-message="{$ subscribeBlock.emailRequired $}"
        autocomplete="off"
        disabled="[[subscribed]]">

        <iron-icon icon="hoverboard:checked" slot="suffix" hidden$="[[!subscribed]]"></iron-icon>
      </paper-input>
      <paper-button
        on-tap="_subscribe"
        ga-on="click"
        disabled="[[subscribed]]"
        ga-event-category="attendees"
        ga-event-action="subscribe"
          ga-event-label="subscribe footer"
          layout
          self-end>
        [[ctaLabel]]
      </paper-button>
    </div>
`;
  }

  static get is() {
    return 'subscribe-form-footer';
  }

  static get properties() {
    return {
      subscribed: {
        type: Boolean,
      },
      validate: {
        type: Boolean,
        value: false,
      },
      ctaLabel: {
        type: String,
        computed: '_computeButtonLabel(subscribed)',
      },
    };
  }

  static mapStateToProps(state, _element) {
    return {
      subscribed: state.subscribed,
    };
  }

  _subscribe() {
    this.validate = true;
    const emailInput = this.shadowRoot.querySelector('#emailInput');

    if (!this.subscribed && emailInput.validate()) {
      this.dispatchAction(subscribeActions.subscribe({ email: this.email }));
    }
  }

  _computeButtonLabel(subscribed) {
    return subscribed ?
      '{$  subscribeBlock.subscribed $}' :
      '{$  subscribeBlock.subscribe $}';
  }
}

window.customElements.define(SubscribeFormFooter.is, SubscribeFormFooter);
