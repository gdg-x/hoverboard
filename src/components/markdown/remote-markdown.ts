import { Failure, fold, Initialized, Pending, RemoteData, Success } from '@abraham/remotedata';
import { html, TemplateResult } from 'lit';
import { customElement, property, state } from 'lit/decorators.js';
import './toc-markdown';
import { ThemedElement } from '../themed-element';

type State = RemoteData<Error, string>;

@customElement('remote-markdown')
export class RemoteMarkDown extends ThemedElement {
  @property()
  path: string = '';

  @state()
  state: State = new Initialized();

  override render() {
    return html`${this.view(this.state)}`;
  }

  get view() {
    return fold<TemplateResult<1>, Error, string>(
      () => html``,
      () => html`Loading...`,
      () => html`Error loading content`,
      (data) => html`<toc-markdown content="${data}"></toc-markdown>`
    );
  }

  override connectedCallback() {
    super.connectedCallback();
    this.loadContent();
  }

  private async loadContent() {
    this.state = new Pending();
    try {
      if (this.path === '') {
        throw new Error('Invalid path');
      }
      const content = await fetch(this.path).then((response) => response.text());
      this.state = new Success(content);
    } catch (error) {
      this.state = new Failure(error as Error);
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'remote-markdown': RemoteMarkDown;
  }
}
