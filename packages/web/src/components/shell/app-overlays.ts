import { html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { StoreController } from '../../controllers/store-controller';
import { DIALOG, selectIsDialogOpen } from '../../store/dialogs';
import { ThemedElement } from '../themed-element';

type LazyElement =
  'feedback-dialog' | 'signin-dialog' | 'subscribe-dialog' | 'video-dialog' | 'snack-bar';

/** The dialogs and the snackbar. Each loads the first time the store asks for it. */
@customElement('app-overlays')
export class AppOverlays extends ThemedElement {
  private readonly lazyElements: Record<LazyElement, () => Promise<unknown>> = {
    'feedback-dialog': () => import('../dialogs/feedback-dialog'),
    'signin-dialog': () => import('../dialogs/signin-dialog'),
    'subscribe-dialog': () => import('../dialogs/subscribe-dialog'),
    'video-dialog': () => import('../dialogs/video-dialog'),
    'snack-bar': () => import('./snack-bar'),
  };
  private readonly loadingElements = new Set<LazyElement>();
  @state()
  private accessor loadedElements = new Set<LazyElement>();

  private readonly neededElementsStore = new StoreController(
    this,
    (state): Record<LazyElement, boolean> => ({
      'feedback-dialog': selectIsDialogOpen(state, DIALOG.FEEDBACK),
      'signin-dialog': selectIsDialogOpen(state, DIALOG.SIGNIN),
      'subscribe-dialog': selectIsDialogOpen(state, DIALOG.SUBSCRIBE),
      'video-dialog': state.ui.videoDialog.open,
      'snack-bar': state.snackbars.length > 0,
    }),
    {
      equals: (a, b) => (Object.keys(a) as LazyElement[]).every((tag) => a[tag] === b[tag]),
      onChange: (needed) => this.loadNeededElements(needed),
    },
  );

  private loadNeededElements(needed: Record<LazyElement, boolean>) {
    (Object.keys(needed) as LazyElement[]).forEach((tag) => {
      if (!needed[tag] || this.loadedElements.has(tag) || this.loadingElements.has(tag)) {
        return;
      }
      this.loadingElements.add(tag);
      this.lazyElements[tag]()
        .then(() => {
          this.loadedElements = new Set(this.loadedElements).add(tag);
        })
        .catch(() => this.loadingElements.delete(tag));
    });
  }

  override render() {
    const loaded = this.loadedElements;

    return html`
      ${loaded.has('feedback-dialog') ? html`<feedback-dialog></feedback-dialog>` : nothing}
      ${loaded.has('signin-dialog') ? html`<signin-dialog></signin-dialog>` : nothing}
      ${loaded.has('subscribe-dialog') ? html`<subscribe-dialog></subscribe-dialog>` : nothing}
      ${loaded.has('video-dialog') ? html`<video-dialog></video-dialog>` : nothing}
      ${loaded.has('snack-bar') ? html`<snack-bar></snack-bar>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'app-overlays': AppOverlays;
  }
}
