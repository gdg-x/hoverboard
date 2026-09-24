import '@justinribeiro/lite-youtube';
import '@material/web/button/outlined-button.js';
import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { RootState } from '../store';
import { ReduxMixin } from '../store/mixin';
import { closeVideoDialog, initialUiState } from '../store/ui';
import { HoverboardDialog } from './hoverboard-dialog';
import './hoverboard-dialog';
import { ThemedElement } from './themed-element';

@customElement('video-dialog')
export class VideoDialog extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          --hoverboard-dialog-min-width: 80vw;
        }

        @media only screen and (max-width: 600px) {
          :host {
            --hoverboard-dialog-min-width: 100vw;
          }
        }
      `,
    ];
  }

  @query('#dialog')
  dialog!: HoverboardDialog;

  @state()
  private video = initialUiState.videoDialog;

  override firstUpdated() {
    this.dialog.addEventListener('closed', () => closeVideoDialog());
  }

  override stateChanged(state: RootState) {
    this.video = state.ui.videoDialog;
  }

  override render() {
    return html`
      <hoverboard-dialog id="dialog" ?open="${this.video.open}">
        <div slot="headline">${this.video.title}</div>
        <div slot="content" class="video-wrapper">
          <lite-youtube
            videoid="${this.video.youtubeId}"
            videotitle="${this.video.title}"
            params="autoplay=1"
            autoload
          ></lite-youtube>
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
    'video-dialog': VideoDialog;
  }
}
