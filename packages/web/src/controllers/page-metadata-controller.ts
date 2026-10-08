import type { ReactiveController, ReactiveControllerHost } from 'lit';
import { description, title } from '../config/site';
import { INCLUDE_SITE_TITLE, updateMetadata } from '../utils/metadata';
import { type Page, pageText } from '../utils/page-text';

/**
 * Sets the document title and description for a page, and again when the locale changes. The
 * home page uses the site's title and description.
 */
export class PageMetadataController implements ReactiveController {
  constructor(
    host: ReactiveControllerHost,
    private readonly page: Page | 'home',
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
    if (this.page === 'home') {
      updateMetadata(title, description, INCLUDE_SITE_TITLE.NO);
      return;
    }
    const { title: pageTitle, metaDescription } = pageText(this.page);
    updateMetadata(pageTitle, metaDescription);
  }
}
