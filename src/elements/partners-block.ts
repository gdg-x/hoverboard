import { customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState, store } from '../store';
import { closeDialog, openDialog, setDialogError } from '../store/dialogs/actions';
import { DIALOGS } from '../store/dialogs/types';
import { addPartner, fetchPartners } from '../store/partners/actions';
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

        <template is="dom-repeat" items="[[partners]]" as="block">
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
                  lazy-load
                  preload
                  fade
                ></plastic-image>
              </a>
            </template>
          </div>
        </template>

        <paper-button class="cta-button animated icon-right" on-click="_addPotentialPartner">
          <span>{$ partnersBlock.button $}</span>
          <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
        </paper-button>
      </div>
    `;
  }

  @property({ type: Object })
  private viewport = {};
  @property({ type: Array })
  private partners = [];
  @property({ type: Boolean })
  private partnersFetching = false;
  @property({ type: Object })
  private partnersFetchingError = {};
  @property({ type: Boolean, observer: PartnersBlock.prototype._partnerAddingChanged })
  private partnerAdding = false;
  @property({ type: Object })
  private partnerAddingError = {};

  stateChanged(state: RootState) {
    this.viewport = state.ui.viewport;
    this.partners = state.partners.list;
    this.partnersFetching = state.partners.fetching;
    this.partnersFetchingError = state.partners.fetchingError;
    this.partnerAdding = state.partners.adding;
    this.partnerAddingError = state.partners.addingError;
  }

  connectedCallback() {
    super.connectedCallback();
    if (!this.partnersFetching && (!this.partners || !this.partners.length)) {
      store.dispatch(fetchPartners());
    }
  }

  _addPotentialPartner() {
    openDialog(DIALOGS.SUBSCRIBE, {
      title: '{$ partnersBlock.form.title $}',
      submitLabel: '{$ partnersBlock.form.submitLabel $}',
      firstFieldLabel: '{$ partnersBlock.form.fullName $}',
      secondFieldLabel: '{$ partnersBlock.form.companyName $}',
      submit: (data) => {
        store.dispatch(addPartner(data));
      },
    });
  }

  _partnerAddingChanged(newPartnerAdding, oldPartnerAdding) {
    if (oldPartnerAdding && !newPartnerAdding) {
      if (this.partnerAddingError) {
        setDialogError(DIALOGS.SUBSCRIBE);
      } else {
        closeDialog(DIALOGS.SUBSCRIBE);
        showToast({ message: '{$ partnersBlock.toast $}' });
      }
    }
  }
}
