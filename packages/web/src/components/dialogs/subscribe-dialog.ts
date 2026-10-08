import { Failure, Initialized, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/textfield/outlined-text-field.js';
import { MdOutlinedTextField } from '@material/web/textfield/outlined-text-field.js';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { StoreController } from '../../controllers/store-controller';
import { fromStore } from '../../controllers/from-store';
import type { DialogForm } from '../../models/dialog-form';
import { closeDialog, type DialogState, DIALOG, selectIsDialogOpen } from '../../store/dialogs';
import {
  initialPotentialPartnersState,
  type PotentialPartnersState,
} from '../../store/potential-partners';
import type { SubscribeState } from '../../store/subscribe';
import { subscribeBlock } from '../../config/site';
import { notEmpty, validEmail } from '../../utils/strings';
import { HoverboardDialog } from '../shared/hoverboard-dialog';
import '../shared/hoverboard-dialog';
import { ThemedElement } from '../themed-element';

// Used for adding documents to both `subscribers` and `potentialPartners` collections

@customElement('subscribe-dialog')
export class SubscribeDialog extends ThemedElement {
  static override styles = css`
    :host {
      --md-outlined-text-field-focus-outline-color: var(--default-primary-color);
    }

    md-outlined-text-field {
      display: block;
      margin: 16px 32px 0;
    }

    md-outlined-text-field:first-of-type {
      margin-top: 0;
    }

    .general-error {
      margin: 0 32px;
      color: var(--error-color);
    }
  `;

  private get subscribeBlock() {
    return subscribeBlock;
  }

  @query('#dialog')
  accessor dialog!: HoverboardDialog;
  @query('#emailInput')
  accessor emailInput!: MdOutlinedTextField;
  @query('#firstFieldInput')
  accessor firstFieldInput!: MdOutlinedTextField;
  @query('#secondFieldInput')
  accessor secondFieldInput!: MdOutlinedTextField;

  @state()
  override accessor title = '';
  @fromStore((state) => selectIsDialogOpen(state, DIALOG.SUBSCRIBE))
  private accessor open!: boolean;
  @state()
  private accessor subscribed: SubscribeState = new Initialized();
  @state()
  private accessor potentialPartners: PotentialPartnersState = initialPotentialPartnersState;
  @state()
  private accessor errorOccurred = false;
  @state()
  private accessor dialogState: DialogState = new Initialized();
  @state()
  private accessor firstFieldValue = '';
  @state()
  private accessor secondFieldValue = '';
  @state()
  private accessor submitLabel = '';
  @state()
  private accessor firstFieldLabel = '';
  @state()
  private accessor secondFieldLabel = '';
  @state()
  private accessor email = '';
  @state()
  private accessor firstFieldInvalid = false;
  @state()
  private accessor secondFieldInvalid = false;
  @state()
  private accessor emailInvalid = false;

  private readonly subscribedStore = new StoreController(this, (state) => state.subscribed, {
    onChange: (value) => {
      const previous = this.subscribed;
      this.subscribed = value;
      if (value !== previous) {
        this.onResult(value);
      }
    },
  });

  private readonly potentialPartnersStore = new StoreController(
    this,
    (state) => state.potentialPartners,
    {
      onChange: (value) => {
        const previous = this.potentialPartners;
        this.potentialPartners = value;
        if (value !== previous) {
          this.onResult(value);
        }
      },
    },
  );

  private readonly dialogStore = new StoreController(this, (state) => state.dialogs, {
    onChange: (value) => {
      const previous = this.dialogState;
      this.dialogState = value;
      if (value !== previous && value instanceof Success && value.data.name === DIALOG.SUBSCRIBE) {
        const data = value.data.data;
        this.title = data.title || this.subscribeBlock.formTitle;
        this.submitLabel = data.submitLabel ?? '';
        this.firstFieldLabel = data.firstFieldLabel ?? '';
        this.secondFieldLabel = data.secondFieldLabel ?? '';
        this.prefillFields(data);
      }
    },
  });

  private onResult(result: SubscribeState | PotentialPartnersState) {
    if (result instanceof Success) {
      closeDialog();
    } else if (result instanceof Failure) {
      this.errorOccurred = true;
    }
  }

  override firstUpdated() {
    this.dialog.addEventListener('closed', () => closeDialog());
  }

  override render() {
    const firstFieldLabel =
      this.firstFieldLabel || msg('First Name', { id: 'dialogs.subscribe.first-name' });
    const secondFieldLabel =
      this.secondFieldLabel || msg('Last Name', { id: 'dialogs.subscribe.last-name' });
    const emailLabel = msg('Email Address', { id: 'dialogs.subscribe.email' });
    const fieldRequired = msg('Field required.', { id: 'dialogs.subscribe.field-required' });
    return html`
      <hoverboard-dialog id="dialog" ?open="${this.open}">
        <div slot="headline">${this.title}</div>
        <div slot="content">
          ${
            this.errorOccurred
              ? html`<div class="general-error">
                  ${msg('An error has occurred. Please, try again later.', {
                    id: 'common.general-error',
                  })}
                </div>`
              : ''
          }
          <md-outlined-text-field
            id="firstFieldInput"
            label="${firstFieldLabel} *"
            .value="${this.firstFieldValue}"
            required
            ?error="${this.firstFieldInvalid}"
            error-text="${fieldRequired}"
            autocomplete="off"
            @input="${this.onFirstFieldChanged}"
          >
          </md-outlined-text-field>
          <md-outlined-text-field
            id="secondFieldInput"
            label="${secondFieldLabel} *"
            .value="${this.secondFieldValue}"
            required
            ?error="${this.secondFieldInvalid}"
            error-text="${fieldRequired}"
            autocomplete="off"
            @input="${this.onSecondFieldChanged}"
          >
          </md-outlined-text-field>
          <md-outlined-text-field
            id="emailInput"
            label="${emailLabel} *"
            .value="${this.email}"
            required
            ?error="${this.emailInvalid}"
            error-text="${msg('Please enter a valid email address.', { id: 'common.email-invalid' })}"
            autocomplete="off"
            @input="${this.onEmailChanged}"
          >
          </md-outlined-text-field>
        </div>

        <md-filled-button slot="actions" @click="${this.subscribe}">
          ${
            this.submitLabel ||
            msg('Subscribe', {
              id: 'common.subscribe',
              desc: 'Button that submits a subscription.',
            })
          }
        </md-filled-button>
        <md-outlined-button slot="actions" @click="${this.close}">
          ${msg('Close', { id: 'common.close' })}
        </md-outlined-button>
      </hoverboard-dialog>
    `;
  }

  private close() {
    this.errorOccurred = false;
    this.dialog.close();
  }

  private onFirstFieldChanged(event: Event) {
    this.firstFieldValue = (event.target as MdOutlinedTextField).value;
  }

  private onSecondFieldChanged(event: Event) {
    this.secondFieldValue = (event.target as MdOutlinedTextField).value;
  }

  private onEmailChanged(event: Event) {
    this.email = (event.target as MdOutlinedTextField).value;
  }

  private subscribe() {
    if (this.dialogState instanceof Success && this.dialogState.data.name === DIALOG.SUBSCRIBE) {
      if (!this.firstFieldInput.reportValidity() || !this.validateField(this.firstFieldValue)) {
        this.firstFieldInvalid = true;
        return;
      }
      this.firstFieldInvalid = false;

      if (!this.secondFieldInput.reportValidity() || !this.validateField(this.secondFieldValue)) {
        this.secondFieldInvalid = true;
        return;
      }
      this.secondFieldInvalid = false;

      if (!this.emailInput.reportValidity() || !this.validateEmail(this.email)) {
        this.emailInvalid = true;
        return;
      }
      this.emailInvalid = false;

      this.dialogState.data.data.submit({
        email: this.email,
        firstFieldValue: this.firstFieldValue,
        secondFieldValue: this.secondFieldValue,
      });
    }
  }

  private validateEmail(email: string) {
    return validEmail(email);
  }

  private validateField(value: string) {
    return notEmpty(value);
  }

  private prefillFields(userData: DialogForm) {
    this.firstFieldValue = userData ? userData.firstFieldValue || '' : '';
    this.secondFieldValue = userData ? userData.secondFieldValue || '' : '';
    this.email = '';
    this.firstFieldInvalid = false;
    this.secondFieldInvalid = false;
    this.emailInvalid = false;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'subscribe-dialog': SubscribeDialog;
  }
}
