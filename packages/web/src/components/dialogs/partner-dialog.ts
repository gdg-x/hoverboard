import { Failure, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import type { PotentialPartner } from '../../models/potential-partner';
import { store } from '../../store';
import { closeDialog, DIALOG, selectIsDialogOpen } from '../../store/dialogs';
import { addPotentialPartner, type PotentialPartnersState } from '../../store/potential-partners';
import { queueSnackbar } from '../../store/snackbars';
import { needsNetworkMessage, selectOnline } from '../../store/sync';
import { notEmpty, validEmail } from '../../utils/strings';
import '../ui/hb-button';
import '../ui/hb-dialog';
import type { HbDialog } from '../ui/hb-dialog';
import '../ui/hb-text-field';
import type { HbTextField } from '../ui/hb-text-field';
import { ThemedComponent } from '../themed-component';

type FieldName = keyof PotentialPartner;

interface Field {
  name: FieldName;
  label: string;
  type: 'text' | 'email';
  maxlength: number;
  autocomplete: string;
  error: string;
  valid: (value: string) => boolean;
}

// In the order they show and are checked.
const fields = (): Field[] => {
  const required = msg('Field required.', { id: 'dialogs.subscribe.field-required' });
  return [
    {
      name: 'fullName',
      label: msg('Full Name', { id: 'home.partners-block.full-name' }),
      type: 'text',
      maxlength: 100,
      autocomplete: 'name',
      error: required,
      valid: notEmpty,
    },
    {
      name: 'companyName',
      label: msg('Company Name', { id: 'home.partners-block.company-name' }),
      type: 'text',
      maxlength: 100,
      autocomplete: 'organization',
      error: required,
      valid: notEmpty,
    },
    {
      name: 'email',
      label: msg('Email Address', { id: 'dialogs.subscribe.email' }),
      type: 'email',
      maxlength: 254,
      autocomplete: 'email',
      error: msg('Please enter a valid email address.', { id: 'common.email-invalid' }),
      valid: validEmail,
    },
  ];
};

const EMPTY: PotentialPartner = { fullName: '', companyName: '', email: '' };

/** Asks for a would-be partner's name, company and email, and thanks them once it's sent. */
@customElement('partner-dialog')
export class PartnerDialog extends ThemedComponent {
  static override styles = css`
    .fields {
      display: grid;
      gap: var(--hb-space-4);
    }

    .general-error {
      margin: 0;
      color: var(--hb-color-error);
    }

    .offline {
      margin: 0;
      font-weight: 600;
    }
  `;

  @query('hb-dialog')
  private accessor dialog!: HbDialog;

  @fromStore((state) => selectIsDialogOpen(state, DIALOG.PARTNER))
  private accessor open!: boolean;
  @fromStore(selectOnline)
  private accessor online!: boolean;
  @fromStore((state) => state.potentialPartners)
  private accessor potentialPartners!: PotentialPartnersState;

  @state()
  private accessor values = EMPTY;
  @state()
  private accessor invalid: FieldName | undefined;
  @state()
  private accessor errorOccurred = false;

  override willUpdate(changed: PropertyValues) {
    if (changed.has('open') && this.open) {
      this.values = EMPTY;
      this.invalid = undefined;
    }
    // Only a request sent from the open dialog, not the state the page loaded with.
    if (this.open && changed.has('potentialPartners') && changed.get('potentialPartners')) {
      if (this.potentialPartners instanceof Success) {
        closeDialog();
        store.dispatch(
          queueSnackbar(msg('We will contact you soon!', { id: 'home.partners-block.added' })),
        );
      } else if (this.potentialPartners instanceof Failure) {
        this.errorOccurred = true;
      }
    }
  }

  override render() {
    return html`
      <hb-dialog
        heading="${msg('Become a partner!', { id: 'home.partners-block.form-title' })}"
        ?open="${this.open}"
        @close="${this.onClose}"
      >
        <div class="fields">
          ${
            this.errorOccurred
              ? html`<div class="general-error">
                  ${msg('An error has occurred. Please, try again later.', {
                    id: 'common.general-error',
                  })}
                </div>`
              : nothing
          }
          ${this.online ? nothing : html`<p class="offline">${needsNetworkMessage()}</p>`}
          ${fields().map(
            (field) => html`
              <hb-text-field
                name="${field.name}"
                type="${field.type}"
                label="${field.label} *"
                .value="${this.values[field.name]}"
                required
                maxlength="${field.maxlength}"
                error="${this.invalid === field.name ? field.error : ''}"
                autocomplete="${field.autocomplete}"
                @input="${(event: Event) => this.onInput(field.name, event)}"
              ></hb-text-field>
            `,
          )}
        </div>

        <hb-button slot="actions" ?disabled="${!this.online}" @click="${this.submit}">
          ${msg('Submit', { id: 'home.partners-block.submit' })}
        </hb-button>
        <hb-button slot="actions" variant="outlined" @click="${() => this.dialog.close()}">
          ${msg('Close', { id: 'common.close' })}
        </hb-button>
      </hb-dialog>
    `;
  }

  private readonly onClose = () => {
    this.errorOccurred = false;
    closeDialog();
  };

  private onInput(name: FieldName, event: Event) {
    this.values = { ...this.values, [name]: (event.target as HbTextField).value };
  }

  private readonly submit = () => {
    // The first field that isn't valid shows its error, and stops the request.
    this.invalid = fields().find(({ name, valid }) => {
      const input = this.renderRoot.querySelector<HbTextField>(`hb-text-field[name="${name}"]`);
      return !input?.reportValidity() || !valid(this.values[name]);
    })?.name;
    if (!this.invalid) addPotentialPartner(this.values);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'partner-dialog': PartnerDialog;
  }
}
