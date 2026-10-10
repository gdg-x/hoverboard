import { Failure, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { css, html, nothing, type PropertyValues } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { fromStore } from '../../controllers/from-store';
import type { DialogData, DialogForm } from '../../models/dialog-form';
import type { RootState } from '../../store';
import { closeDialog, DIALOG } from '../../store/dialogs';
import type { PotentialPartnersState } from '../../store/potential-partners';
import type { SubscribeState } from '../../store/subscribe';
import { needsNetworkMessage, selectOnline } from '../../store/sync';
import { subscribeBlock } from '../../config/site';
import { notEmpty, validEmail } from '../../utils/strings';
import '../ui/hb-button';
import '../ui/hb-dialog';
import type { HbDialog } from '../ui/hb-dialog';
import '../ui/hb-text-field';
import type { HbTextField } from '../ui/hb-text-field';
import { ThemedComponent } from '../themed-component';

type FieldName = keyof Required<DialogData>;

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
const fields = (form: DialogForm | undefined): Field[] => {
  const required = msg('Field required.', { id: 'dialogs.subscribe.field-required' });
  const text = { type: 'text', maxlength: 100, autocomplete: 'off', error: required } as const;
  return [
    {
      ...text,
      name: 'firstFieldValue',
      label: form?.firstFieldLabel || msg('First Name', { id: 'dialogs.subscribe.first-name' }),
      valid: notEmpty,
    },
    {
      ...text,
      name: 'secondFieldValue',
      label: form?.secondFieldLabel || msg('Last Name', { id: 'dialogs.subscribe.last-name' }),
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

const EMPTY: Record<FieldName, string> = { firstFieldValue: '', secondFieldValue: '', email: '' };

// The form the opener passed, while the dialog is open.
const selectForm = ({ dialogs }: RootState): DialogForm | undefined =>
  dialogs instanceof Success && dialogs.data.name === DIALOG.SUBSCRIBE
    ? dialogs.data.data
    : undefined;

/**
 * A form with two text fields and an email address, which an opener labels and submits, such as
 * the partner request. It closes once the submission succeeds.
 */
@customElement('subscribe-dialog')
export class SubscribeDialog extends ThemedComponent {
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

  @fromStore(selectForm)
  private accessor form: DialogForm | undefined;
  @fromStore(selectOnline)
  private accessor online!: boolean;
  @fromStore((state) => state.subscribed)
  private accessor subscribed!: SubscribeState;
  @fromStore((state) => state.potentialPartners)
  private accessor potentialPartners!: PotentialPartnersState;

  @state()
  private accessor values = EMPTY;
  @state()
  private accessor invalid: FieldName | undefined;
  @state()
  private accessor errorOccurred = false;

  override willUpdate(changed: PropertyValues) {
    if (changed.has('form') && this.form) {
      const { firstFieldValue = '', secondFieldValue = '' } = this.form;
      this.values = { ...EMPTY, firstFieldValue, secondFieldValue };
      this.invalid = undefined;
    }
    // Only a submission from this dialog, not the state the page loaded with.
    for (const name of ['subscribed', 'potentialPartners'] as const) {
      if (this.form && changed.has(name) && changed.get(name) !== undefined) {
        this.onResult(this[name]);
      }
    }
  }

  override render() {
    const form = this.form;
    return html`
      <hb-dialog
        heading="${form?.title || subscribeBlock.formTitle}"
        ?open="${!!form}"
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
          ${fields(form).map(
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
          ${
            form?.submitLabel ||
            msg('Subscribe', {
              id: 'common.subscribe',
              desc: 'Button that submits a subscription.',
            })
          }
        </hb-button>
        <hb-button slot="actions" variant="outlined" @click="${() => this.dialog.close()}">
          ${msg('Close', { id: 'common.close' })}
        </hb-button>
      </hb-dialog>
    `;
  }

  private onResult(result: SubscribeState | PotentialPartnersState) {
    if (result instanceof Success) {
      closeDialog();
    } else if (result instanceof Failure) {
      this.errorOccurred = true;
    }
  }

  private readonly onClose = () => {
    this.errorOccurred = false;
    closeDialog();
  };

  private onInput(name: FieldName, event: Event) {
    this.values = { ...this.values, [name]: (event.target as HbTextField).value };
  }

  private readonly submit = () => {
    const form = this.form;
    if (!form) return;
    // The first field that isn't valid shows its error, and stops the submission.
    this.invalid = fields(form).find(({ name, valid }) => {
      const input = this.renderRoot.querySelector<HbTextField>(`hb-text-field[name="${name}"]`);
      return !input?.reportValidity() || !valid(this.values[name]);
    })?.name;
    if (!this.invalid) form.submit(this.values);
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'subscribe-dialog': SubscribeDialog;
  }
}
