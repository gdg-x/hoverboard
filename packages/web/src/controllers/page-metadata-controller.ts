import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { updateMetadata } from '../utils/metadata';
import { type Page, pageText } from '../utils/page-text';

/** Sets the document title and description for a page, and again when the locale changes. */
export class PageMetadataController implements ReactiveController {
  constructor(
    host: ReactiveControllerHost,
    private readonly page: Page,
  ) {
    host.addController(this);
  }

  hostConnected() {
    this.update();
    window.addEventListener('lit-localize-status', this.onLocaleStatus);
  }

  hostDisconnected() {
    window.removeEventListener('lit-localize-status', this.onLocaleStatus);
  }

  private readonly onLocaleStatus = (event: WindowEventMap['lit-localize-status']) => {
    if (event.detail.status === 'ready') this.update();
  };

  private update() {
    const { title, metaDescription } = pageText(this.page);
    updateMetadata(title, metaDescription);
  }
}
