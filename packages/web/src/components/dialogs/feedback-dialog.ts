import { Initialized, Success } from '@abraham/remotedata';
import '@material/web/button/outlined-button.js';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import type { Session } from '../../models/session';
import type { RootState } from '../../store';
import { closeDialog, type DialogState, DIALOG, selectIsDialogOpen } from '../../store/dialogs';
import { feedback } from '../../utils/data';
import './feedback-block';
import { HoverboardDialog } from '../shared/hoverboard-dialog';
import '../shared/hoverboard-dialog';
import { StatefulElement } from '../stateful-element';

@customElement('feedback-dialog')
export class FeedbackDialog extends StatefulElement {
  static override styles = css`
    :host {
      --hoverboard-dialog-width: 85%;
      --hoverboard-dialog-max-width: 420px;
    }
  `;

  private feedback = feedback;

  @query('#dialog')
  dialog!: HoverboardDialog;

  @state()
  private open = false;
  @state()
  private data: DialogState = new Initialized();
  @state()
  private session?: Session;

  override firstUpdated() {
    this.dialog.addEventListener('closed', () => closeDialog());
  }

  override stateChanged(state: RootState) {
    this.data = state.dialogs;
    this.open = selectIsDialogOpen(state, DIALOG.FEEDBACK);
    if (this.data instanceof Success && this.data.data.name === DIALOG.FEEDBACK) {
      this.session = this.data.data.data;
    }
  }

  override render() {
    return html`
      <hoverboard-dialog id="dialog" ?open="${this.open}">
        <div slot="headline">${this.feedback.headline}</div>
        <div slot="content" class="feedback-content">
          <feedback-block .sessionId="${this.session?.id}"></feedback-block>
        </div>

        <md-outlined-button slot="actions" @click="${this.close}">Close</md-outlined-button>
      </hoverboard-dialog>
    `;
  }

  private close() {
    this.dialog.close();
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'feedback-dialog': FeedbackDialog;
  }
}
