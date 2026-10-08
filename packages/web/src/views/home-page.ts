import { IntersectionController } from '@lit-labs/observers/intersection-controller.js';
import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property, query } from 'lit/decorators.js';
import '../components/home/about-block';
import '../components/home/about-organizer-block';
import '../components/home/home-hero';
import { ThemedElement } from '../components/themed-element';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import { store } from '../store';
import { queueSnackbar } from '../store/snackbars';
import type { EventState } from '../utils/event-state';
import { scrollToElement } from '../utils/scrolling';

// `__HB_FEATURES__.<name>` is a literal in the build, so blocks of disabled features are not bundled.
if (__HB_FEATURES__.speakers) void import('../components/home/speakers-block');
if (__HB_FEATURES__.subscribe) void import('../components/home/subscribe-block');
if (__HB_FEATURES__.blog) void import('../components/home/latest-posts-block');

// Below-the-fold blocks load when they are about to scroll into view.
const lazyBlocks = {
  ...(__HB_FEATURES__.tickets && {
    'tickets-block': () => import('../components/home/tickets-block'),
  }),
  ...(__HB_FEATURES__.gallery && {
    'gallery-block': () => import('../components/home/gallery-block'),
  }),
  ...(__HB_FEATURES__.videos && {
    'featured-videos': () => import('../components/home/featured-videos'),
  }),
  ...(__HB_FEATURES__.map && { 'map-block': () => import('../components/home/map-block') }),
  ...(__HB_FEATURES__.partners && {
    'partners-block': () => import('../components/home/partners-block'),
  }),
};
type LazyBlock = keyof typeof lazyBlocks;

@customElement('home-page')
export class HomePage extends ThemedElement {
  static override styles = css`
    :host {
      display: block;
    }

    /*
     * Sections alternate between the surface and an accent color, counted over the blocks the
     * site shows, so turning a feature off never puts two of the same color together.
     */
    .band {
      --hb-band-background: var(--hb-color-surface);
      --hb-band-color: var(--hb-color-on-surface);

      background-color: var(--hb-band-background);
      color: var(--hb-band-color);
    }

    .band[data-tone='accent-4'] {
      --hb-band-background: var(--hb-color-accent-4-container);
      --hb-band-color: var(--hb-color-on-accent-4-container);
    }

    .band[data-tone='accent-2'] {
      --hb-band-background: var(--hb-color-accent-2-container);
      --hb-band-color: var(--hb-color-on-accent-2-container);
    }

    .band[data-tone='accent-1'] {
      --hb-band-background: var(--hb-color-accent-1-container);
      --hb-band-color: var(--hb-color-on-accent-1-container);
    }

    .band:not(:defined) {
      display: block;
      min-block-size: 480px;
    }
  `;

  private readonly metadata = new PageMetadataController(this, 'home');

  /** The event state when the page was built. The hero checks again in the browser. */
  @property({ attribute: 'event-state' })
  accessor eventState: EventState = 'upcoming';

  @property({ type: Number, attribute: 'days-to-go' })
  accessor daysToGo = 0;

  @query('#tickets')
  private accessor ticketsBlock!: HTMLElement | null;

  private readonly scrollToTickets = async () => {
    // The block has no height until it is defined, so load it before scrolling.
    await lazyBlocks['tickets-block']?.();
    const element = this.ticketsBlock;
    if (element) {
      scrollToElement(element);
    } else {
      store.dispatch(
        queueSnackbar(msg('Error scrolling to section.', { id: 'pages.home.scroll-error' })),
      );
    }
  };

  override firstUpdated() {
    this.observeLazyBlocks();
    this.scrollToHash();
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('hashchange', this.scrollToHash);
  }

  override disconnectedCallback() {
    window.removeEventListener('hashchange', this.scrollToHash);
    super.disconnectedCallback();
  }

  // Blocks are in the shadow root, where the browser does not look for `#subscribe` and others.
  private readonly scrollToHash = () => {
    const id = window.location.hash.slice(1);
    const element = id ? this.renderRoot.querySelector(`#${CSS.escape(id)}`) : null;
    if (element) scrollToElement(element);
  };

  private readonly blockObserver = new IntersectionController(this, {
    target: null,
    config: { rootMargin: '600px 0px' },
    callback: (entries) =>
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        this.blockObserver.unobserve(entry.target);
        lazyBlocks[entry.target.localName as LazyBlock]?.();
      }),
  });

  private observeLazyBlocks() {
    (Object.keys(lazyBlocks) as LazyBlock[]).forEach((tag) => {
      const element = this.renderRoot.querySelector(tag);
      if (element && !customElements.get(tag)) {
        this.blockObserver.observe(element);
      }
    });
  }

  override render() {
    const tone = bandTones();
    return html`
      <home-hero
        event-state="${this.eventState}"
        days-to-go="${this.daysToGo}"
        @show-tickets="${this.scrollToTickets}"
      ></home-hero>
      <about-block class="band" data-tone="${tone('about-block')}"></about-block>
      ${
        __HB_FEATURES__.speakers
          ? html`<speakers-block
              class="band"
              data-tone="${tone('speakers-block')}"
            ></speakers-block>`
          : nothing
      }
      ${__HB_FEATURES__.subscribe ? html`<subscribe-block id="subscribe"></subscribe-block>` : nothing}
      ${
        __HB_FEATURES__.tickets
          ? html`<tickets-block
              id="tickets"
              class="band"
              data-tone="${tone('tickets-block')}"
            ></tickets-block>`
          : nothing
      }
      ${
        __HB_FEATURES__.gallery
          ? html`<gallery-block class="band" data-tone="${tone('gallery-block')}"></gallery-block>`
          : nothing
      }
      <about-organizer-block
        class="band"
        data-tone="${tone('about-organizer-block')}"
      ></about-organizer-block>
      ${
        __HB_FEATURES__.videos
          ? html`<featured-videos
              class="band"
              data-tone="${tone('featured-videos')}"
            ></featured-videos>`
          : nothing
      }
      ${
        __HB_FEATURES__.blog
          ? html`<latest-posts-block
              class="band"
              data-tone="${tone('latest-posts-block')}"
            ></latest-posts-block>`
          : nothing
      }
      ${
        __HB_FEATURES__.map
          ? html`<map-block class="band" data-tone="${tone('map-block')}"></map-block>`
          : nothing
      }
      ${
        __HB_FEATURES__.partners
          ? html`<partners-block
              class="band"
              data-tone="${tone('partners-block')}"
            ></partners-block>`
          : nothing
      }
    `;
  }
}

const TONES = ['surface', 'accent-4', 'surface', 'accent-2', 'surface', 'accent-1'];

/** Each band's tone by its place among the blocks the site shows. Subscribe has its own. */
const bandTones = () => {
  const bands = [
    'about-block',
    __HB_FEATURES__.speakers && 'speakers-block',
    __HB_FEATURES__.tickets && 'tickets-block',
    __HB_FEATURES__.gallery && 'gallery-block',
    'about-organizer-block',
    __HB_FEATURES__.videos && 'featured-videos',
    __HB_FEATURES__.blog && 'latest-posts-block',
    __HB_FEATURES__.map && 'map-block',
    __HB_FEATURES__.partners && 'partners-block',
  ].filter((band) => typeof band === 'string');
  return (band: string) => TONES[bands.indexOf(band) % TONES.length] ?? 'surface';
};

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
