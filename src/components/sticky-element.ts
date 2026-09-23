import { css, html } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import { ThemedElement } from './themed-element';

@customElement('sticky-element')
export class StickyElement extends ThemedElement {
  static override get styles() {
    return [
      ...super.styles,
      css`
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
          margin-top: 56px;
          position: fixed;
          top: 0;
          right: 0;
          left: 0;
          z-index: 9;
        }

        #content.sticked::before {
          opacity: 1;
        }

        @media (min-width: 812px) {
          .sticked {
            margin-top: 64px;
          }
        }
      `,
    ];
  }

  @query('#content')
  content!: HTMLDivElement;

  @query('#trigger')
  trigger!: HTMLDivElement;

  @state()
  private waiting = false;

  @state()
  private endScrollHandle: number | undefined;

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('scroll', this.onScroll, { passive: true });
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('scroll', this.onScroll);
    this.content?.classList.remove('sticked');
  }

  override render() {
    return html`
      <div id="trigger" data-testid="trigger"></div>
      <div id="content" data-testid="content">
        <slot></slot>
      </div>
    `;
  }

  private onScroll = () => {
    if (this.waiting) {
      return;
    }
    this.waiting = true;
    window.clearTimeout(this.endScrollHandle);

    this.toggleSticky();

    window.setTimeout(() => {
      this.waiting = false;
    }, 100);

    this.endScrollHandle = window.setTimeout(() => {
      this.toggleSticky();
    }, 200);
  };

  private toggleSticky() {
    const trigger = this.trigger;
    const content = this.content;

    if (!trigger || !content) {
      console.error('Missing trigger or content element.');
      return;
    }

    const scrollTop = trigger.getBoundingClientRect().top;
    if (scrollTop > 64 && content.classList.contains('sticked')) {
      content.classList.remove('sticked');
      this.dispatchEvent(
        new CustomEvent('element-sticked', {
          bubbles: true,
          composed: true,
          detail: {
            sticked: false,
          },
        }),
      );
    } else if (scrollTop <= 64 && !content.classList.contains('sticked')) {
      this.style.height = `${this.content.offsetHeight}px`;
      content.classList.add('sticked');
      this.dispatchEvent(
        new CustomEvent('element-sticked', {
          bubbles: true,
          composed: true,
          detail: {
            sticked: true,
          },
        }),
      );
    }
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'sticky-element': StickyElement;
  }
}
