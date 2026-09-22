import { Success } from '@abraham/remotedata';
import '@material/web/button/outlined-button.js';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { Session } from '../models/session';
import { RootState } from '../store';
import { closeDialog } from '../store/dialogs/actions';
import { selectIsDialogOpen } from '../store/dialogs/selectors';
import { DialogState, initialDialogState } from '../store/dialogs/state';
import { DIALOG } from '../store/dialogs/types';
import { ReduxMixin } from '../store/mixin';
import { feedback } from '../utils/data';
import './feedback-block';
import { HoverboardDialog } from './hoverboard-dialog';
import './hoverboard-dialog';
import { ThemedElement } from './themed-element';

@customElement('feedback-dialog')
export class FeedbackDialog extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          --hoverboard-dialog-width: 85%;
          --hoverboard-dialog-max-width: 420px;
        }
      `,
    ];
  }

  private feedback = feedback;

  @query('#dialog')
  dialog!: HoverboardDialog;

  @state()
  private open = false;
  @state()
  private data: DialogState = initialDialogState;
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
