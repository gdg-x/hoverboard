import { IntersectionController } from '@lit-labs/observers/intersection-controller.js';
import { css, html } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import { ThemedElement } from '../themed-element';

@customElement('sticky-element')
export class StickyElement extends ThemedElement {
  static override styles = css`
    :host {
      position: relative;
    }

    /* Leaves the viewport as the content reaches the bottom of the app header. */
    #trigger {
      position: absolute;
      top: calc(-1 * var(--header-height));
      left: 0;
      width: 100%;
      height: 1px;
      pointer-events: none;
    }

    #content::before {
      position: absolute;
      right: 0;
      bottom: -5px;
      left: 0;
      width: 100%;
      height: 5px;
      content: '';
      transition: opacity 0.4s;
      pointer-events: none;
      opacity: 0;
      box-shadow: inset 0 5px 6px -3px rgba(0, 0, 0, 0.4);
      will-change: opacity;
    }

    .sticked {
      margin-top: var(--header-height);
      position: fixed;
      top: 0;
      right: 0;
      left: 0;
      z-index: 9;
    }

    #content.sticked::before {
      opacity: 1;
    }
  `;

  @query('#content')
  content!: HTMLDivElement;

  @query('#trigger')
  trigger!: HTMLDivElement;

  private readonly observer = new IntersectionController(this, {
    target: null,
    callback: (entries) => this.onIntersection(entries),
  });

  override disconnectedCallback() {
    super.disconnectedCallback();
    this.content?.classList.remove('sticked');
  }

  override firstUpdated() {
    this.observer.observe(this.trigger);
  }

  override render() {
    return html`
      <div id="trigger" data-testid="trigger"></div>
      <div id="content" data-testid="content">
        <slot></slot>
      </div>
    `;
  }

  private onIntersection = (entries: IntersectionObserverEntry[]) => {
    const entry = entries[entries.length - 1];
    if (!entry) {
      return;
    }
    this.setSticked(!entry.isIntersecting && entry.boundingClientRect.top < 0);
  };

  private setSticked(sticked: boolean) {
    const content = this.content;
    if (!content || content.classList.contains('sticked') === sticked) {
      return;
    }

    if (sticked) {
      // Keep the space in the layout while the content is fixed.
      this.style.height = `${content.offsetHeight}px`;
    }
    content.classList.toggle('sticked', sticked);
    this.dispatchEvent(
      new CustomEvent('element-sticked', {
        bubbles: true,
        composed: true,
        detail: { sticked },
      }),
    );
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sticky-element': StickyElement;
  }
}
