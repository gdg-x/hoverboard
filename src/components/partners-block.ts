import { Failure, Initialized, Pending, Success } from '@abraham/remotedata';
import '@material/web/button/text-button.js';
import '@power-elements/lazy-image';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { RootState, store } from '../store';
import { closeDialog, openSubscribeDialog } from '../store/dialogs/actions';
import { ReduxMixin } from '../store/mixin';
import { PartnerGroupsState, selectPartnerGroups } from '../store/partners';
import { addPotentialPartner } from '../store/potential-partners/actions';
import { initialPotentialPartnersState } from '../store/potential-partners/state';
import { queueSnackbar } from '../store/snackbars';
import { loading, partnersBlock } from '../utils/data';
import './hoverboard-icon';
import { ThemedElement } from './themed-element';

@customElement('partners-block')
export class PartnersBlock extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
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
          --lazy-image-width: 100%;
          --lazy-image-height: 84px;
          --lazy-image-fit: contain;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
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
      `,
    ];
  }

  private loading = loading;
  private partnersBlock = partnersBlock;

  @property({ type: Object })
  potentialPartners = initialPotentialPartnersState;
  @property({ type: Object })
  partners: PartnerGroupsState = new Initialized();

  private get pending() {
    return this.partners instanceof Pending;
  }

  private get failure() {
    return this.partners instanceof Failure;
  }

  override stateChanged(state: RootState) {
    this.partners = selectPartnerGroups(state);
    this.potentialPartners = state.potentialPartners;
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('potentialPartners') && this.potentialPartners instanceof Success) {
      closeDialog();
      store.dispatch(queueSnackbar(this.partnersBlock.toast));
    }
  }

  override render() {
    const partners = this.partners instanceof Success ? this.partners.data : [];

    return html`
      <div class="container">
        <h1 class="container-title">${this.partnersBlock.title}</h1>

        ${this.pending ? html`<p>${this.loading}</p>` : nothing}
        ${this.failure ? html`<p>Error loading partners.</p>` : nothing}
        ${partners.map(
          (block) => html`
            <h4 class="block-title">${block.title}</h4>
            <div class="logos-wrapper">
              ${block.items.map(
                (logo) => html`
                  <a
                    class="logo-item"
                    href="${logo.url}"
                    title="${logo.name}"
                    target="_blank"
                    rel="noopener noreferrer"
                    layout
                    horizontal
                    center-center
                  >
                    <lazy-image
                      class="logo-img"
                      src="${logo.logoUrl}"
                      alt="${logo.name}"
                    ></lazy-image>
                  </a>
                `,
              )}
            </div>
          `,
        )}

        <md-text-button class="cta-button animated icon-right" @click="${this.addPotentialPartner}">
          <span>${this.partnersBlock.button}</span>
          <hoverboard-icon name="arrow-right-circle"></hoverboard-icon>
        </md-text-button>
      </div>
    `;
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
}

declare global {
  interface HTMLElementTagNameMap {
    'partners-block': PartnersBlock;
  }
}
