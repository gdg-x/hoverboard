import '@justinribeiro/lite-youtube';
import { msg } from '@lit/localize';
import '@material/web/button/outlined-button.js';
import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { closeVideoDialog, initialUiState } from '../../store/ui';
import { HoverboardDialog } from '../shared/hoverboard-dialog';
import '../shared/hoverboard-dialog';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('video-dialog')
export class VideoDialog extends ThemedElement {
  static override styles = css`
    :host {
      --hoverboard-dialog-min-width: 80vw;
    }

    @media only screen and (max-width: 600px) {
      :host {
        --hoverboard-dialog-min-width: 100vw;
      }
    }
  `;

  @query('#dialog')
  accessor dialog!: HoverboardDialog;

  @fromStore((state) => state.ui.videoDialog)
  private accessor video!: typeof initialUiState.videoDialog;

  override firstUpdated() {
    this.dialog.addEventListener('closed', () => closeVideoDialog());
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
        <md-outlined-button slot="actions" @click="${this.close}">
          ${msg('Close', { id: 'common.close' })}
        </md-outlined-button>
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
