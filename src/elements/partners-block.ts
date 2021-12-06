import { Failure, Initialized, Pending } from '@abraham/remotedata';
import { computed, customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState, store } from '../store';
import { closeDialog, openDialog, setDialogError } from '../store/dialogs/actions';
import { DIALOGS } from '../store/dialogs/types';
import { fetchPartners } from '../store/partners/actions';
import { initialPartnersState, PartnersState } from '../store/partners/state';
import { addPotentialPartner } from '../store/potential-partners/actions';
import { showToast } from '../store/toast/actions';
import './hoverboard-icons';
import './shared-styles';

@customElement('partners-block')
export class PartnersBlock extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: block;
        }

        .block-title {
          margin: 24px 0 8px;
        }

        .logos-wrapper {
          display: grid;
          grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
          grid-gap: 8px;
        }

        .logo-item {
          padding: 12px;
        }

        .logo-img {
          height: 84px;
          width: 100%;
        }

        .cta-button {
          margin-top: 24px;
          color: var(--default-primary-color);
        }

        @media (min-width: 640px) {
          .logos-wrapper {
            grid-template-columns: repeat(4, 1fr);
          }
        }

        @media (min-width: 812px) {
          .logos-wrapper {
            grid-template-columns: repeat(5, 1fr);
          }
        }
      </style>

      <div class="container">
        <h1 class="container-title">{$ partnersBlock.title $}</h1>

        <paper-button class="cta-button animated icon-right" on-click="_addPotentialPartner">
          <span>{$ partnersBlock.button $}</span>
          <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
        </paper-button>

        <template is="dom-if" if="[[pending]]">
          <p>Loading...</p>
        </template>
        <template is="dom-if" if="[[failure]]">
          <p>Error loading partners.</p>
        </template>

        <template is="dom-repeat" items="[[partners.data]]" as="block">
          <h4 class="block-title">[[block.title]]</h4>
          <div class="logos-wrapper">
            <template is="dom-repeat" items="[[block.items]]" as="logo">
              <a
                class="logo-item"
                href$="[[logo.url]]"
                title$="[[logo.name]]"
                target="_blank"
                rel="noopener noreferrer"
                layout
                horizontal
                center-center
              >
                <plastic-image
                  class="logo-img"
                  srcset="[[logo.logoUrl]]"
                  sizing="contain"
                  height="[[logo.height]]"
                  lazy-load
                  preload
                  fade
                ></plastic-image>
              </a>
            </template>
          </div>
        </template>
      </div>
    `;
  }

  @property({ type: Object })
  private viewport = {};
  @property({ type: Boolean, observer: PartnersBlock.prototype._partnerAddingChanged })
  private partnerAdding = false;
  @property({ type: Object })
  private partnerAddingError: Error;

  @property({ type: Object })
  partners: PartnersState = initialPartnersState;

  @computed('partners')
  get pending() {
    return this.partners instanceof Pending;
  }

  @computed('partners')
  get failure() {
    return this.partners instanceof Failure;
  }

  stateChanged(state: RootState) {
    this.viewport = state.ui.viewport;
    this.partners = state.partners;
    this.partnerAdding = state.potentialPartners.adding;
    this.partnerAddingError = state.potentialPartners.addingError;
  }

  connectedCallback() {
    super.connectedCallback();
    if (this.partners instanceof Initialized) {
      store.dispatch(fetchPartners());
    }
  }

  _addPotentialPartner() {
    openDialog(DIALOGS.SUBSCRIBE, {
      title: '{$ partnersBlock.form.title $}',
      submitLabel: '{$ partnersBlock.form.submitLabel $}',
      firstFieldLabel: '{$ partnersBlock.form.fullName $}',
      secondFieldLabel: '{$ partnersBlock.form.companyName $}',
      submit: (data) => store.dispatch(addPotentialPartner(data)),
    });
  }

  _partnerAddingChanged(newPartnerAdding, oldPartnerAdding) {
    if (oldPartnerAdding && !newPartnerAdding) {
      if (this.partnerAddingError) {
        setDialogError(this.partnerAddingError);
      } else {
        closeDialog();
        showToast({ message: '{$ partnersBlock.toast $}' });
      }
    }
  }
}
