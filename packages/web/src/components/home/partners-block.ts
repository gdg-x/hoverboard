import { Failure, Pending, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement } from 'lit/decorators.js';
import { store } from '../../store';
import { closeDialog, openSubscribeDialog } from '../../store/dialogs';
import { type PartnerGroupsState, selectPartnerGroups } from '../../store/partners';
import { addPotentialPartner, initialPotentialPartnersState } from '../../store/potential-partners';
import { queueSnackbar } from '../../store/snackbars';
import '../shared/hoverboard-icon';
import '../ui/hb-button';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('partners-block')
export class PartnersBlock extends ThemedElement {
  static override styles = css`
    .block-title {
      margin: 24px 0 8px;
    }

    .logos-wrapper {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(150px, 1fr));
      grid-gap: 8px;
    }

    .logo-item {
      display: flex;
      flex-direction: row;
      align-items: center;
      justify-content: center;
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
  `;

  @fromStore((state) => state.potentialPartners)
  accessor potentialPartners!: typeof initialPotentialPartnersState;
  @fromStore((state) => selectPartnerGroups(state))
  accessor partners!: PartnerGroupsState;

  private get pending() {
    return this.partners instanceof Pending;
  }

  private get failure() {
    return this.partners instanceof Failure;
  }

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('potentialPartners') && this.potentialPartners instanceof Success) {
      closeDialog();
      store.dispatch(
        queueSnackbar(msg('We will contact you soon!', { id: 'home.partners-block.added' })),
      );
    }
  }

  override render() {
    const partners = this.partners instanceof Success ? this.partners.data : [];

    return html`
      <div class="container">
        <h1 class="container-title">${msg('Partners', { id: 'home.partners-block.title' })}</h1>

        ${this.pending ? html`<p>${msg('Loading...', { id: 'common.loading' })}</p>` : nothing}
        ${
          this.failure
            ? html`<p>${msg('Error loading partners.', { id: 'home.partners-block.error' })}</p>`
            : nothing
        }
        ${partners.map(
          (block) => html`
            <h4 class="block-title">${block.title}</h4>
            <div class="logos-wrapper">
              ${block.items.map(
                (logo) => html`
                  <a
                    class="logo-item card"
                    href="${logo.url}"
                    title="${logo.name}"
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <img
                      loading="lazy"
                      decoding="async"
                      class="logo-img"
                      src="${logo.logoUrl}"
                      alt="${logo.name}"
                    />
                  </a>
                `,
              )}
            </div>
          `,
        )}

        <hb-button
          variant="text"
          class="cta-button"
          trailing-icon
          @click="${this.addPotentialPartner}"
        >
          ${msg('Become a partner', { id: 'home.partners-block.cta' })}
          <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
        </hb-button>
      </div>
    `;
  }

  private addPotentialPartner = () => {
    openSubscribeDialog({
      title: msg('Become a partner!', { id: 'home.partners-block.form-title' }),
      submitLabel: msg('Submit', { id: 'home.partners-block.submit' }),
      firstFieldLabel: msg('Full Name', { id: 'home.partners-block.full-name' }),
      secondFieldLabel: msg('Company Name', { id: 'home.partners-block.company-name' }),
      submit: (data) => addPotentialPartner(data),
    });
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'partners-block': PartnersBlock;
  }
}
