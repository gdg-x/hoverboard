import { Initialized, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { html } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { StoreController } from '../../controllers/store-controller';
import { fromStore } from '../../controllers/from-store';
import type { Session } from '../../models/session';
import { closeDialog, type DialogState, DIALOG, selectIsDialogOpen } from '../../store/dialogs';
import './feedback-block';
import '../ui/hb-dialog';
import { ThemedElement } from '../themed-element';

@customElement('feedback-dialog')
export class FeedbackDialog extends ThemedElement {
  @fromStore((state) => selectIsDialogOpen(state, DIALOG.FEEDBACK))
  private accessor open!: boolean;
  @state()
  private accessor data: DialogState = new Initialized();
  @state()
  private accessor session: Pick<Session, 'id' | 'title'> | undefined;

  private readonly dialogStore = new StoreController(this, (state) => state.dialogs, {
    onChange: (value) => {
      this.data = value;
      if (value instanceof Success && value.data.name === DIALOG.FEEDBACK) {
        this.session = value.data.data;
      }
    },
  });

  override render() {
    return html`
      <hb-dialog
        heading="${msg('Review session', { id: 'common.review-session' })}"
        ?open="${this.open}"
        @close="${() => closeDialog()}"
      >
        <feedback-block .sessionId="${this.session?.id}"></feedback-block>
      </hb-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'feedback-dialog': FeedbackDialog;
  }
}
