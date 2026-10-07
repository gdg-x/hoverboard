import { Initialized, Success } from '@abraham/remotedata';
import '@material/web/button/outlined-button.js';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { StoreController } from '../../controllers/store-controller';
import { fromStore } from '../../controllers/from-store';
import type { Session } from '../../models/session';
import { closeDialog, type DialogState, DIALOG, selectIsDialogOpen } from '../../store/dialogs';
import { feedback } from '../../config/site';
import './feedback-block';
import { HoverboardDialog } from '../shared/hoverboard-dialog';
import '../shared/hoverboard-dialog';
import { ThemedElement } from '../themed-element';

@customElement('feedback-dialog')
export class FeedbackDialog extends ThemedElement {
  static override styles = css`
    :host {
      --hoverboard-dialog-width: 85%;
      --hoverboard-dialog-max-width: 420px;
    }
  `;

  private feedback = feedback;

  @query('#dialog')
  accessor dialog!: HoverboardDialog;

  @fromStore((state) => selectIsDialogOpen(state, DIALOG.FEEDBACK))
  private accessor open!: boolean;
  @state()
  private accessor data: DialogState = new Initialized();
  @state()
  private accessor session: Session | undefined;

  override firstUpdated() {
    this.dialog.addEventListener('closed', () => closeDialog());
  }

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
