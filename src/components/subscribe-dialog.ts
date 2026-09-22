import { Failure, Success } from '@abraham/remotedata';
import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@material/web/textfield/outlined-text-field.js';
import { MdOutlinedTextField } from '@material/web/textfield/outlined-text-field.js';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { DialogForm } from '../models/dialog-form';
import { RootState } from '../store';
import { closeDialog } from '../store/dialogs/actions';
import { selectIsDialogOpen } from '../store/dialogs/selectors';
import { DialogState, initialDialogState } from '../store/dialogs/state';
import { DIALOG } from '../store/dialogs/types';
import { ReduxMixin } from '../store/mixin';
import {
  initialPotentialPartnersState,
  PotentialPartnersState,
} from '../store/potential-partners/state';
import { initialSubscribeState, SubscribeState } from '../store/subscribe/state';
import { subscribeBlock } from '../utils/data';
import { notEmpty, validEmail } from '../utils/strings';
import { HoverboardDialog } from './hoverboard-dialog';
import './hoverboard-dialog';
import { ThemedElement } from './themed-element';

// Used for adding documents to both `subscribers` and `potentialPartners` collections

@customElement('subscribe-dialog')
export class SubscribeDialog extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
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
      `,
    ];
  }

  private subscribeBlock = subscribeBlock;

  @query('#dialog')
  dialog!: HoverboardDialog;
  @query('#emailInput')
  emailInput!: MdOutlinedTextField;
  @query('#firstFieldInput')
  firstFieldInput!: MdOutlinedTextField;
  @query('#secondFieldInput')
  secondFieldInput!: MdOutlinedTextField;

  @state()
  override title = '';
  @state()
  private open = false;
  @state()
  private subscribed: SubscribeState = initialSubscribeState;
  @state()
  private potentialPartners: PotentialPartnersState = initialPotentialPartnersState;
  @state()
  private errorOccurred = false;
  @state()
  private dialogState: DialogState = initialDialogState;
  @state()
  private firstFieldValue = '';
  @state()
  private secondFieldValue = '';
  @state()
  private submitLabel = '';
  @state()
  private firstFieldLabel = '';
  @state()
  private secondFieldLabel = '';
  @state()
  private email = '';
  @state()
  private firstFieldInvalid = false;
  @state()
  private secondFieldInvalid = false;
  @state()
  private emailInvalid = false;

  override stateChanged(state: RootState) {
    const previousSubscribed = this.subscribed;
    const previousPotentialPartners = this.potentialPartners;
    const previousDialogState = this.dialogState;

    this.subscribed = state.subscribed;
    this.potentialPartners = state.potentialPartners;
    this.open = selectIsDialogOpen(state, DIALOG.SUBSCRIBE);
    this.dialogState = state.dialogs;

    if (this.subscribed !== previousSubscribed) {
      if (this.subscribed instanceof Success) {
        closeDialog();
      } else if (this.subscribed instanceof Failure) {
        this.errorOccurred = true;
      }
    }

    if (this.potentialPartners !== previousPotentialPartners) {
      if (this.potentialPartners instanceof Success) {
        closeDialog();
      } else if (this.potentialPartners instanceof Failure) {
        this.errorOccurred = true;
      }
    }

    if (
      this.dialogState !== previousDialogState &&
      this.dialogState instanceof Success &&
      this.dialogState.data.name === DIALOG.SUBSCRIBE
    ) {
      const data = this.dialogState.data.data;
      this.title = data.title || this.subscribeBlock.formTitle;
      this.submitLabel = data.submitLabel || this.subscribeBlock.subscribe;
      this.firstFieldLabel = data.firstFieldLabel || this.subscribeBlock.firstName;
      this.secondFieldLabel = data.secondFieldLabel || this.subscribeBlock.lastName;
      this.prefillFields(data);
    }
  }

  override firstUpdated() {
    this.dialog.addEventListener('closed', () => closeDialog());
  }

  override render() {
    return html`
      <hoverboard-dialog id="dialog" ?open="${this.open}">
        <div slot="headline">${this.title}</div>
        <div slot="content">
          ${
            this.errorOccurred
              ? html`<div class="general-error">${this.subscribeBlock.generalError}</div>`
              : ''
          }
          <md-outlined-text-field
            id="firstFieldInput"
            label="${this.firstFieldLabel} *"
            .value="${this.firstFieldValue}"
            required
            ?error="${this.firstFieldInvalid}"
            error-text="${this.subscribeBlock.fieldRequired}"
            autocomplete="off"
            @input="${this.onFirstFieldChanged}"
          >
          </md-outlined-text-field>
          <md-outlined-text-field
            id="secondFieldInput"
            label="${this.secondFieldLabel} *"
            .value="${this.secondFieldValue}"
            required
            ?error="${this.secondFieldInvalid}"
            error-text="${this.subscribeBlock.fieldRequired}"
            autocomplete="off"
            @input="${this.onSecondFieldChanged}"
          >
          </md-outlined-text-field>
          <md-outlined-text-field
            id="emailInput"
            label="${this.subscribeBlock.emailAddress} *"
            .value="${this.email}"
            required
            ?error="${this.emailInvalid}"
            error-text="${this.subscribeBlock.emailRequired}"
            autocomplete="off"
            @input="${this.onEmailChanged}"
          >
          </md-outlined-text-field>
        </div>

        <md-filled-button slot="actions" @click="${this.subscribe}">
          ${this.submitLabel}
        </md-filled-button>
        <md-outlined-button slot="actions" @click="${this.close}">
          ${this.subscribeBlock.close}
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
