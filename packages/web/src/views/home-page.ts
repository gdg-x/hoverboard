import { IntersectionController } from '@lit-labs/observers/intersection-controller.js';
import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property, query, state } from 'lit/decorators.js';
import '../components/home/about-block';
import '../components/home/about-organizer-block';
import '../components/home/home-hero';
import { ThemedComponent } from '../components/themed-component';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import { disabledSchedule, eventDates, timeZone } from '../config/site';
import { store } from '../store';
import { queueSnackbar } from '../store/snackbars';
import { BAND_TONES, bandTones } from '../styles/band';
import { currentTime } from '../utils/clock';
import { type ContentPresence, hasContent } from '../utils/content-presence';
import type { Feature } from '../config/features';
import { type EventState, eventState } from '../utils/event-state';
import { scrollToElement } from '../utils/scrolling';

// `__HB_FEATURES__.<name>` is a literal in the build, so blocks of disabled features are not bundled.
/** The blocks the page loads without waiting. The server, and tests, wait for them. */
export const homeBlocks = Promise.all([
  __HB_FEATURES__.speakers && import('../components/home/speakers-block'),
  __HB_FEATURES__.subscribe && import('../components/home/subscribe-block'),
  __HB_FEATURES__.blog && import('../components/home/latest-posts-block'),
]);

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

/** The "On now" block, which the page loads in the browser on the event's days. */
export const loadOnNowBlock = () =>
  __HB_FEATURES__.schedule ? import('../components/home/on-now-block') : Promise.resolve();

@customElement('home-page')
export class HomePage extends ThemedComponent {
  static override styles = [
    bandTones,
    css`
      :host {
        display: block;
      }

      .band:not(:defined) {
        display: block;
        min-block-size: 480px;
      }
    `,
  ];

  /** The event state when the page was built. The hero checks again in the browser. */
  @property({ attribute: 'event-state' })
  accessor eventState: EventState = 'upcoming';

  @property({ type: Number, attribute: 'days-to-go' })
  accessor daysToGo = 0;

  /** When the page was built. The hero checks again in the browser. */
  @property({ type: Number })
  accessor time = currentTime();

  /** Which features had content when the site was built. Blocks of the others are hidden. */
  @property({ attribute: false })
  accessor presence: ContentPresence = {};

  private readonly has = (feature: Feature) => hasContent(this.presence, feature);

  @query('#tickets')
  private accessor ticketsBlock!: HTMLElement | null;

  // Depends on the time, so it is only set in the browser.
  @state()
  private accessor duringEvent = false;

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

  constructor() {
    super();
    new PageMetadataController(this, 'home');
  }

  override firstUpdated() {
    this.observeLazyBlocks();
    this.scrollToHash();
    if (
      __HB_FEATURES__.schedule &&
      !disabledSchedule &&
      eventState(new Date(currentTime()), {
        startDate: eventDates.start,
        endDate: eventDates.end,
        timezone: timeZone,
      }) === 'live'
    ) {
      this.duringEvent = true;
      void loadOnNowBlock();
    }
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
        void lazyBlocks[entry.target.localName as LazyBlock]?.();
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
    const tone = toneOf(this.has);
    return html`
      <home-hero
        event-state="${this.eventState}"
        days-to-go="${this.daysToGo}"
        time="${this.time}"
        .presence="${this.presence}"
        @show-tickets="${this.scrollToTickets}"
      ></home-hero>
      ${this.duringEvent ? html`<on-now-block class="band" data-tone="accent-1"></on-now-block>` : nothing}
      <about-block class="band" data-tone="${tone('about-block')}"></about-block>
      ${
        __HB_FEATURES__.speakers && this.has('speakers')
          ? html`<speakers-block
              class="band"
              data-tone="${tone('speakers-block')}"
            ></speakers-block>`
          : nothing
      }
      ${__HB_FEATURES__.subscribe ? html`<subscribe-block id="subscribe"></subscribe-block>` : nothing}
      ${
        __HB_FEATURES__.tickets && this.has('tickets')
          ? html`<tickets-block
              id="tickets"
              class="band"
              data-tone="${tone('tickets-block')}"
            ></tickets-block>`
          : nothing
      }
      ${
        __HB_FEATURES__.gallery && this.has('gallery')
          ? html`<gallery-block class="band" data-tone="${tone('gallery-block')}"></gallery-block>`
          : nothing
      }
      <about-organizer-block
        class="band"
        data-tone="${tone('about-organizer-block')}"
      ></about-organizer-block>
      ${
        __HB_FEATURES__.videos && this.has('videos')
          ? html`<featured-videos
              class="band"
              data-tone="${tone('featured-videos')}"
            ></featured-videos>`
          : nothing
      }
      ${
        __HB_FEATURES__.blog && this.has('blog')
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
        __HB_FEATURES__.partners && this.has('partners')
          ? html`<partners-block
              class="band"
              data-tone="${tone('partners-block')}"
            ></partners-block>`
          : nothing
      }
    `;
  }
}

/**
 * Each band's tone by its place among the blocks the page shows, so turning a feature off, or a
 * feature without content, never puts two of the same color together. Subscribe has its own.
 */
const toneOf = (has: (feature: Feature) => boolean) => {
  const bands = [
    'about-block',
    __HB_FEATURES__.speakers && has('speakers') && 'speakers-block',
    __HB_FEATURES__.tickets && has('tickets') && 'tickets-block',
    __HB_FEATURES__.gallery && has('gallery') && 'gallery-block',
    'about-organizer-block',
    __HB_FEATURES__.videos && has('videos') && 'featured-videos',
    __HB_FEATURES__.blog && has('blog') && 'latest-posts-block',
    __HB_FEATURES__.map && 'map-block',
    __HB_FEATURES__.partners && has('partners') && 'partners-block',
  ].filter((band) => typeof band === 'string');
  return (band: string) => BAND_TONES[bands.indexOf(band) % BAND_TONES.length] ?? 'surface';
};

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
