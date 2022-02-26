import { customElement, property, query } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';

@customElement('sticky-element')
export class StickyElement extends PolymerElement {
  static get template() {
    return html`
      <style>
        :host {
          display: block;
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
      </style>

      <div id="trigger"></div>
      <div id="content">
        <slot></slot>
      </div>
    `;
  }

  @query('#content')
  content!: HTMLDivElement;
  @query('#trigger')
  trigger!: HTMLDivElement;

  @property({ type: Boolean })
  private waiting = false;
  @property({ type: Number })
  private endScrollHandle: number | undefined;

  constructor() {
    super();
    this.onScroll = this.onScroll.bind(this);
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('scroll', this.onScroll);
  }

  override disconnectedCallback() {
    super.disconnectedCallback();
    window.removeEventListener('scroll', this.onScroll);
    this.content.classList.remove('sticked');
  }

  private onScroll() {
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
  }

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
        })
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
        })
      );
    }
  }
}
