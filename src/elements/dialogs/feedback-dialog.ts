import { Success } from '@abraham/remotedata';
import { Dialog } from '@material/mwc-dialog';
import { observe, property, query } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import '@radi-cho/star-rating';
import { Session } from '../../models/session';
import { RootState } from '../../store';
import { closeDialog } from '../../store/dialogs/actions';
import { selectIsDialogOpen } from '../../store/dialogs/selectors';
import { DialogState, initialDialogState } from '../../store/dialogs/state';
import { DIALOG } from '../../store/dialogs/types';
import { ReduxMixin } from '../../store/mixin';
import { feedback } from '../../utils/data';
import '../feedback-block';
import '../shared-styles';

class FeedbackDialog extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: block;
          width: 85%;
          max-width: 420px;

          --paper-input-container-focus-color: var(--default-primary-color);
          --paper-input-container-color: var(--secondary-text-color);
        }
      </style>

      <mwc-dialog id="dialog" open="[[open]]" heading="[[feedback.headline]]">
        <div class="feedback-content">
          <feedback-block session-id="[[session.id]]"></feedback-block>
        </div>

        <mwc-button slot="primaryAction" dialogAction="close">Close</mwc-button>
      </mwc-dialog>
    `;
  }
  static get is() {
    return 'feedback-dialog';
  }

  @query('#dialog')
  dialog!: Dialog;

  @property({ type: Boolean })
  open = false;
  @property({ type: Object })
  data = initialDialogState;
  @property({ type: Object })
  session?: Session;

  private feedback = feedback;

  override ready() {
    super.ready();
    this.dialog.addEventListener('closed', () => closeDialog());
  }

  override stateChanged(state: RootState) {
    this.data = state.dialogs;
    this.open = selectIsDialogOpen(state, DIALOG.FEEDBACK);
  }

  @observe('data')
  private onData(data: DialogState) {
    if (data instanceof Success && data.data.name === DIALOG.FEEDBACK) {
      this.session = data.data.data;
    }
  }
}

window.customElements.define(FeedbackDialog.is, FeedbackDialog);
