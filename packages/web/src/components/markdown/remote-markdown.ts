import { Failure, fold, Initialized, Pending, type RemoteData, Success } from '@abraham/remotedata';
import { msg } from '@lit/localize';
import { html, type PropertyValues, type TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './toc-markdown';
import { fetchText } from '../../utils/fetch-text';
import { ThemedElement } from '../themed-element';

type State = RemoteData<Error, string>;

@customElement('remote-markdown')
export class RemoteMarkDown extends ThemedElement {
  @property()
  accessor path: string = '';

  /** The markdown at `path` when the page was built, so the server renders it and the browser keeps it. */
  @property({ attribute: false })
  accessor content: string | undefined;

  @property({ attribute: 'page-path' })
  accessor pagePath = '';

  @state()
  accessor state: State = new Initialized();

  override render() {
    return html`${this.view(this.state)}`;
  }

  get view() {
    return fold<TemplateResult<1>, Error, string>(
      () => html``,
      () => html`${msg('Loading...', { id: 'common.loading' })}`,
      () => html`${msg('Error loading content', { id: 'markdown.remote-markdown.error' })}`,
      (data) => html`<toc-markdown content="${data}" page-path="${this.pagePath}"></toc-markdown>`,
    );
  }

  // Not in connectedCallback: a server-rendered page sets `content` just before it hydrates.
  override firstUpdated() {
    if (this.content === undefined) this.loadContent();
  }

  override willUpdate(changed: PropertyValues<this>) {
    if (changed.has('content') && this.content !== undefined && this.state instanceof Initialized) {
      this.state = new Success(this.content);
    }
  }

  // A page passes another path when the locale changes.
  override updated(changed: PropertyValues<this>) {
    if (changed.has('path') && changed.get('path') !== undefined) this.loadContent();
  }

  private request = 0;

  private async loadContent() {
    const request = ++this.request;
    this.state = new Pending();
    try {
      if (this.path === '') {
        throw new Error('Invalid path');
      }
      const content = await fetchText(this.path);
      if (request === this.request) this.state = new Success(content);
    } catch (error) {
      if (request === this.request) this.state = new Failure(error as Error);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'remote-markdown': RemoteMarkDown;
  }
}
