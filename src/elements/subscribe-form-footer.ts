import { customElement, property } from '@polymer/decorators';
import '@polymer/paper-input/paper-input';
import { PaperInputElement } from '@polymer/paper-input/paper-input';
import { html, PolymerElement } from '@polymer/polymer';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState, store } from '../store';
import { subscribe } from '../store/subscribe/actions';
import './hoverboard-icons';
import './shared-styles';

@customElement('subscribe-form-footer')
export class SubscribeFormFooter extends ReduxMixin(PolymerElement) {
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
          disabled="[[subscribed]]"
        >
          <iron-icon icon="hoverboard:checked" slot="suffix" hidden$="[[!subscribed]]"></iron-icon>
        </paper-input>
        <paper-button
          on-click="_subscribe"
          ga-on="click"
          disabled="[[subscribed]]"
          ga-event-category="attendees"
          ga-event-action="subscribe"
          ga-event-label="subscribe footer"
          layout
          self-end
        >
          [[ctaLabel]]
        </paper-button>
      </div>
    `;
  }

  @property({ type: Boolean, computed: '_computeButtonLabel(subscribed)' })
  private subscribed = false;
  @property({ type: Boolean })
  private validate = false;
  @property({ type: String })
  private ctaLabel: string;
  @property({ type: String })
  private email: string;

  stateChanged(state: RootState) {
    this.subscribed = state.subscribed;
  }

  _subscribe() {
    this.validate = true;
    const emailInput = this.shadowRoot.querySelector<PaperInputElement>('#emailInput');

    if (!this.subscribed && emailInput.validate()) {
      store.dispatch(subscribe({ email: this.email }));
    }
  }

  _computeButtonLabel(subscribed) {
    return subscribed ? '{$  subscribeBlock.subscribed $}' : '{$  subscribeBlock.subscribe $}';
  }
}
