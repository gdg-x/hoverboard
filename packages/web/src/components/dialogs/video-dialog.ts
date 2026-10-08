import '@justinribeiro/lite-youtube';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { closeVideoDialog, initialUiState } from '../../store/ui';
import '../ui/hb-dialog';
import { fromStore } from '../../controllers/from-store';
import { ThemedElement } from '../themed-element';

@customElement('video-dialog')
export class VideoDialog extends ThemedElement {
  static override styles = css`
    hb-dialog {
      --hb-dialog-width: 960px;
    }
  `;

  @fromStore((state) => state.ui.videoDialog)
  private accessor video!: typeof initialUiState.videoDialog;

  override render() {
    return html`
      <hb-dialog
        heading="${this.video.title}"
        ?open="${this.video.open}"
        @close="${() => closeVideoDialog()}"
      >
        <lite-youtube
          videoid="${this.video.youtubeId}"
          videotitle="${this.video.title}"
          params="autoplay=1"
          autoload
        ></lite-youtube>
      </hb-dialog>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'video-dialog': VideoDialog;
  }
}
