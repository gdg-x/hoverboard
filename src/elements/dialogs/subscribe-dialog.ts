import { Failure, Success } from '@abraham/remotedata';
import '@material/mwc-button';
import '@material/mwc-dialog';
import { Dialog } from '@material/mwc-dialog';
import { observe, property, query } from '@polymer/decorators';
import '@polymer/paper-button';
import '@polymer/paper-input/paper-input';
import { PaperInputElement } from '@polymer/paper-input/paper-input';
import { html, PolymerElement } from '@polymer/polymer';
import { DialogForm } from '../../models/dialog-form';
import { RootState } from '../../store';
import { closeDialog } from '../../store/dialogs/actions';
import { selectIsDialogOpen } from '../../store/dialogs/selectors';
import { DialogState, initialDialogState } from '../../store/dialogs/state';
import { DIALOG } from '../../store/dialogs/types';
import { ReduxMixin } from '../../store/mixin';
import {
  initialPotentialPartnersState,
  PotentialPartnersState,
} from '../../store/potential-partners/state';
import { initialSubscribeState, SubscribeState } from '../../store/subscribe/state';
import { subscribeBlock } from '../../utils/data';
import '../../utils/icons';
import { notEmpty, validEmail } from '../../utils/strings';
import '../shared-styles';

// Used for adding documents to both `subscribers` and `potentialPartners` collections

class SubscribeDialog extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: block;
          --paper-input-container-focus-color: var(--default-primary-color);
          --paper-input-container-color: var(--secondary-text-color);
          --mdc-theme-primary: var(--default-primary-color);
          --mdc-theme-secondary: var(--secondary-text-color);
        }

        paper-input {
          margin: 16px 32px 0;
        }

        paper-input:first-of-type {
          margin-top: 0;
        }

        .general-error {
          margin: 0 32px;
          color: var(--error-color);
        }
      </style>

      <mwc-dialog id="dialog" open="[[open]]" heading="[[title]]">
        <div hidden$="[[!errorOccurred]]" class="general-error">
          [[subscribeBlock.generalError]]
        </div>
        <paper-input
          id="firstFieldInput"
          on-touchend="triggerFocus"
          label="[[firstFieldLabel]] *"
          value="{{firstFieldValue}}"
          required
          auto-validate$="[[validate]]"
          error-message="[[subscribeBlock.fieldRequired]]"
          autocomplete="off"
        >
        </paper-input>
        <paper-input
          id="secondFieldInput"
          on-touchend="triggerFocus"
          label="[[secondFieldLabel]] *"
          value="{{secondFieldValue}}"
          required
          auto-validate$="[[validate]]"
          error-message="[[subscribeBlock.fieldRequired]]"
          autocomplete="off"
        >
        </paper-input>
        <paper-input
          id="emailInput"
          on-touchend="triggerFocus"
          label="[[subscribeBlock.emailAddress]] *"
          value="{{email}}"
          required
          auto-validate$="[[validate]]"
          error-message="[[subscribeBlock.emailRequired]]"
          autocomplete="off"
        >
        </paper-input>

        <mwc-button on-click="subscribe" slot="primaryAction"> [[submitLabel]] </mwc-button>
        <mwc-button on-click="close" slot="secondaryAction" dialogAction="cancel">
          [[subscribeBlock.close]]
        </mwc-button>
      </mwc-dialog>
    `;
  }

  static get is() {
    return 'subscribe-dialog';
  }

  @property({ type: String })
  override title = '';

  @property({ type: Boolean })
  private open = false;
  @property({ type: Object })
  private subscribed = initialSubscribeState;
  @property({ type: Object })
  private potentialPartners = initialPotentialPartnersState;
  @property({ type: Boolean })
  private validate = true;
  @property({ type: Boolean })
  private errorOccurred = false;
  @property({ type: Object })
  private dialog = initialDialogState;
  @property({ type: String })
  private firstFieldValue = '';
  @property({ type: String })
  private secondFieldValue = '';
  @property({ type: String })
  private submitLabel = '';
  @property({ type: String })
  private firstFieldLabel = '';
  @property({ type: String })
  private secondFieldLabel = '';
  @property({ type: String })
  private email = '';
  @property({ type: Number })
  private initialHeight = 0;

  private subscribeBlock = subscribeBlock;

  @query('#dialog')
  dialogElm!: Dialog;
  @query('#emailInput')
  emailInput!: PaperInputElement;
  @query('#firstFieldInput')
  firstFieldInput!: PaperInputElement;
  @query('#secondFieldInput')
  secondFieldInput!: PaperInputElement;

  override stateChanged(state: RootState) {
    this.subscribed = state.subscribed;
    this.potentialPartners = state.potentialPartners;
    this.open = selectIsDialogOpen(state, DIALOG.SUBSCRIBE);
    this.dialog = state.dialogs;
  }

  override ready() {
    super.ready();
    this.initialHeight = window.innerHeight;
    this.dialogElm.addEventListener('closed', () => closeDialog());
  }

  private close() {
    this.errorOccurred = false;
    closeDialog();
  }

  @observe('subscribed')
  private onSubscribed(subscribed: SubscribeState) {
    if (subscribed instanceof Success) {
      closeDialog();
    } else if (subscribed instanceof Failure) {
      this.errorOccurred = true;
    }
  }

  @observe('potentialPartners')
  private onPotentialPartners(potentialPartners: PotentialPartnersState) {
    if (potentialPartners instanceof Success) {
      closeDialog();
    } else if (potentialPartners instanceof Failure) {
      this.errorOccurred = true;
    }
  }

  @observe('open', 'dialog')
  private onOpenAndDialog(_open: boolean, dialog: DialogState) {
    if (dialog instanceof Success && dialog.data.name === DIALOG.SUBSCRIBE) {
      const data = dialog.data.data;
      this.title = data.title || this.subscribeBlock.formTitle;
      this.submitLabel = data.submitLabel || this.subscribeBlock.subscribe;
      this.firstFieldLabel = data.firstFieldLabel || this.subscribeBlock.firstName;
      this.secondFieldLabel = data.secondFieldLabel || this.subscribeBlock.lastName;
      this.prefillFields(data);
    }
  }

  private subscribe() {
    if (this.dialog instanceof Success && this.dialog.data.name === DIALOG.SUBSCRIBE) {
      if (
        !this.firstFieldInput.validate() ||
        !this.validateField(this.firstFieldInput.value || '')
      ) {
        this.firstFieldInput.invalid = true;
        return;
      }
      if (
        !this.secondFieldInput.validate() ||
        !this.validateField(this.secondFieldInput.value || '')
      ) {
        this.secondFieldInput.invalid = true;
        return;
      }
      if (!this.emailInput.validate() || !this.validateEmail(this.emailInput.value || '')) {
        this.emailInput.invalid = true;
        return;
      }

      this.dialog.data.data.submit({
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
    this.validate = false;
    this.firstFieldInput.value = userData ? userData.firstFieldValue : '';
    this.secondFieldInput.value = userData ? userData.secondFieldValue : '';
    this.firstFieldInput.focus();
    this.firstFieldInput.blur();
    this.secondFieldInput.focus();
    this.secondFieldInput.blur();
    this.emailInput.blur();
    this.emailInput.value = '';
    this.emailInput.invalid = false;
    this.validate = true;
  }

  private triggerFocus(e: TouchEvent) {
    (e.target as HTMLElement).focus();
  }
}

window.customElements.define(SubscribeDialog.is, SubscribeDialog);
