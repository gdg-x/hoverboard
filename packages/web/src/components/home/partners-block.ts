import { Failure, Pending, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import { store } from '../../store';
import { closeDialog, openSubscribeDialog } from '../../store/dialogs';
import { type PartnerGroupsState, selectPartnerGroups } from '../../store/partners';
import { addPotentialPartner, initialPotentialPartnersState } from '../../store/potential-partners';
import { queueSnackbar } from '../../store/snackbars';
import { band } from '../../styles/band';
import '../shared/hoverboard-icon';
import { ThemedElement } from '../themed-element';
import '../ui/hb-button';

/** Partner logos by group, each group under its own heading. */
@customElement('partners-block')
export class PartnersBlock extends ThemedElement {
  static override styles = [
    band,
    css`
      .group + .group {
        margin-block-start: var(--hb-space-7);
      }

      .group-title {
        margin: 0 0 var(--hb-space-4);
        padding: 0;
        font: 700 var(--hb-text-xl) / 1.2 var(--hb-font-display);
      }

      .logos {
        display: grid;
        grid-template-columns: repeat(auto-fill, minmax(10rem, 1fr));
        gap: var(--hb-space-4);
      }

      /* Most logos are made for white backgrounds, so the tiles stay white in the dark scheme. */
      .logo {
        display: grid;
        place-items: center;
        block-size: 7rem;
        padding: var(--hb-space-4);
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-m);
        background-color: white;
        box-shadow: var(--hb-shadow-card);
        transition:
          translate var(--hb-duration-short) var(--hb-ease-spring),
          box-shadow var(--hb-duration-short) var(--hb-ease-standard);
      }

      .logo:hover {
        translate: -2px -2px;
        box-shadow: var(--hb-shadow-card-hover);
      }

      .logo img {
        display: block;
        inline-size: 100%;
        block-size: 100%;
        object-fit: contain;
      }
    `,
  ];

  @fromStore((state) => state.potentialPartners)
  accessor potentialPartners!: typeof initialPotentialPartnersState;
  @fromStore((state) => selectPartnerGroups(state))
  accessor partners!: PartnerGroupsState;

  override willUpdate(changedProperties: PropertyValues) {
    if (changedProperties.has('potentialPartners') && this.potentialPartners instanceof Success) {
      closeDialog();
      store.dispatch(
        queueSnackbar(msg('We will contact you soon!', { id: 'home.partners-block.added' })),
      );
    }
  }

  override render() {
    const groups = this.partners instanceof Success ? this.partners.data : [];

    return html`
      <div class="inner">
        <div class="band-header">
          <h2 class="band-title">${msg('Partners', { id: 'home.partners-block.title' })}</h2>
          <hb-button
            variant="outlined"
            class="cta-button"
            trailing-icon
            @click="${this.addPotentialPartner}"
          >
            ${msg('Become a partner', { id: 'home.partners-block.cta' })}
            <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
          </hb-button>
        </div>

        ${
          this.partners instanceof Pending
            ? html`<p>${msg('Loading...', { id: 'common.loading' })}</p>`
            : nothing
        }
        ${
          this.partners instanceof Failure
            ? html`<p>${msg('Error loading partners.', { id: 'home.partners-block.error' })}</p>`
            : nothing
        }
        ${groups.map(
          (group) => html`
            <section class="group">
              <h3 class="group-title">${group.title}</h3>
              <ul class="logos plain">
                ${group.items.map(
                  (partner) => html`
                    <li>
                      <a
                        class="logo"
                        href="${partner.url}"
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        <img src="${partner.logoUrl}" alt="${partner.name}" loading="lazy" />
                      </a>
                    </li>
                  `,
                )}
              </ul>
            </section>
          `,
        )}
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
