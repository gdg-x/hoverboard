import { html, nothing } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import { StoreController } from '../../controllers/store-controller';
import { DIALOG, selectIsDialogOpen } from '../../store/dialogs';
import { ThemedComponent } from '../themed-component';

type LazyElement =
  | 'feedback-dialog'
  | 'signin-dialog'
  | 'partner-dialog'
  | 'profile-dialog'
  | 'video-dialog'
  | 'snack-bar';

/** The dialogs and the snackbar. Each loads the first time the store asks for it. */
@customElement('app-overlays')
export class AppOverlays extends ThemedComponent {
  private readonly lazyElements: Record<LazyElement, () => Promise<unknown>> = {
    'feedback-dialog': () => import('../dialogs/feedback-dialog'),
    'signin-dialog': () => import('../dialogs/signin-dialog'),
    'partner-dialog': () => import('../dialogs/partner-dialog'),
    'profile-dialog': () =>
      __HB_FEATURES__.reactions ? import('../dialogs/profile-dialog') : Promise.resolve(),
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
      'partner-dialog': selectIsDialogOpen(state, DIALOG.PARTNER),
      'profile-dialog': selectIsDialogOpen(state, DIALOG.PROFILE),
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
      ${loaded.has('partner-dialog') ? html`<partner-dialog></partner-dialog>` : nothing}
      ${loaded.has('profile-dialog') ? html`<profile-dialog></profile-dialog>` : nothing}
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
