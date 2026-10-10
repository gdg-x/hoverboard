import '@justinribeiro/lite-youtube';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { selectOnline, availableOnlineMessage } from '../../store/sync';
import { closeVideoDialog, initialUiState } from '../../store/ui';
import '../shared/hoverboard-icon';
import '../ui/hb-dialog';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('video-dialog')
export class VideoDialog extends ThemedElement {
  static override styles = css`
    hb-dialog {
      --hb-dialog-width: 960px;
    }

    .offline {
      display: grid;
      place-content: center;
      justify-items: center;
      gap: var(--hb-space-3);
      aspect-ratio: 16 / 9;
      margin: 0;
      border-radius: var(--hb-radius-m);
      background-color: var(--hb-color-surface-container);
      text-align: center;
    }

    .offline hoverboard-icon {
      inline-size: 48px;
      block-size: 48px;
    }
  `;

  @fromStore((state) => state.ui.videoDialog)
  private accessor video!: typeof initialUiState.videoDialog;
  @fromStore(selectOnline)
  private accessor online!: boolean;

  override render() {
    return html`
      <hb-dialog
        heading="${this.video.title}"
        ?open="${this.video.open}"
        @close="${() => closeVideoDialog()}"
      >
        ${
          this.online
            ? html`<lite-youtube
                videoid="${this.video.youtubeId}"
                videotitle="${this.video.title}"
                params="autoplay=1"
                autoload
              ></lite-youtube>`
            : html`<p class="offline">
                <hoverboard-icon name="cloud-off"></hoverboard-icon>
                ${availableOnlineMessage()}
              </p>`
        }
      </hb-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'video-dialog': VideoDialog;
  }
}
