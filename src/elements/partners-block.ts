import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import { computed, customElement, observe, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import { RootState, store } from '../store';
import { closeDialog, openSubscribeDialog } from '../store/dialogs/actions';
import { ReduxMixin } from '../store/mixin';
import { fetchPartners } from '../store/partners/actions';
import { initialPartnersState } from '../store/partners/state';
import { addPotentialPartner } from '../store/potential-partners/actions';
import {
  initialPotentialPartnersState,
  PotentialPartnersState,
} from '../store/potential-partners/state';
import { queueSnackbar } from '../store/snackbars';
import { loading, partnersBlock } from '../utils/data';
import '../utils/icons';
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
        <h1 class="container-title">[[partnersBlock.title]]</h1>

        <template is="dom-if" if="[[pending]]">
          <p>[[loading]]</p>
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
                  lazy-load
                  preload
                  fade
                ></plastic-image>
              </a>
            </template>
          </div>
        </template>

        <paper-button class="cta-button animated icon-right" on-click="addPotentialPartner">
          <span>[[partnersBlock.button]]</span>
          <iron-icon icon="hoverboard:arrow-right-circle"></iron-icon>
        </paper-button>
      </div>
    `;
  }

  private loading = loading;
  private partnersBlock = partnersBlock;

  @property({ type: Object })
  potentialPartners = initialPotentialPartnersState;
  @property({ type: Object })
  partners = initialPartnersState;

  @computed('partners')
  get pending() {
    return this.partners instanceof Pending;
  }

  @computed('partners')
  get failure() {
    return this.partners instanceof Failure;
  }

  override stateChanged(state: RootState) {
    this.partners = state.partners;
    this.potentialPartners = state.potentialPartners;
  }

  override connectedCallback() {
    super.connectedCallback();
    if (this.partners instanceof Initialized) {
      store.dispatch(fetchPartners);
    }
  }

  private addPotentialPartner() {
    openSubscribeDialog({
      title: this.partnersBlock.form.title,
      submitLabel: this.partnersBlock.form.submitLabel,
      firstFieldLabel: this.partnersBlock.form.fullName,
      secondFieldLabel: this.partnersBlock.form.companyName,
      submit: (data) => store.dispatch(addPotentialPartner(data)),
    });
  }

  @observe('potentialPartners')
  private onPotentialPartners(potentialPartners: PotentialPartnersState) {
    if (potentialPartners instanceof Success) {
      closeDialog();
      store.dispatch(queueSnackbar(this.partnersBlock.toast));
    }
  }
}
