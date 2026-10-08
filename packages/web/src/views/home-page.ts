import { IntersectionController } from '@lit-labs/observers/intersection-controller.js';
import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, query } from 'lit/decorators.js';
import '../components/home/about-block';
import '../components/home/about-organizer-block';
import '../components/hero/hero-block';
import { HeroBlock } from '../components/hero/hero-block';
import '../components/shared/hoverboard-icon';
import '../components/ui/hb-button';
import { store } from '../store';
import { queueSnackbar } from '../store/snackbars';
import { openVideoDialog } from '../store/ui';
import { aboutBlock, heroDescriptions, heroSettings, location, title } from '../config/site';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import { getEventDates } from '../utils/dates';
import { POSITION, scrollToElement } from '../utils/scrolling';
import { ThemedElement } from '../components/themed-element';

// `__HB_FEATURES__.<name>` is a literal in the build, so blocks of disabled features are not bundled.
if (__HB_FEATURES__.forkMe) void import('../components/home/fork-me-block');
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
      height: 100%;
    }

    hero-block {
      font-size: 24px;
      text-align: center;
    }

    .hero-logo {
      --lazy-image-width: 100%;
      --lazy-image-height: 76px;
      width: var(--lazy-image-width);
      height: var(--lazy-image-height);
      max-width: 240px;
      max-height: 76px;
    }

    :is(tickets-block, gallery-block, featured-videos, map-block, partners-block):not(:defined) {
      display: block;
      min-height: 480px;
    }

    .info-items {
      margin: 24px auto;
      font-size: 22px;
    }

    .info-items > *:not(:first-of-type) {
      margin-top: 4px;
    }

    .action-buttons {
      margin: 0 -8px;
      font-size: 14px;
      display: flex;
      flex-wrap: wrap;
      justify-content: center;
    }

    .action-buttons hb-button {
      margin: 8px;
    }

    .action-buttons .watch-video {
      color: var(--text-primary-color);
    }

    .scroll-down {
      margin-top: 24px;
      color: currentColor;
      user-select: none;
      cursor: pointer;
    }

    .scroll-down svg {
      width: 24px;
      opacity: 0.6;
    }

    .scroll-down .stroke {
      stroke: currentColor;
    }

    .scroll-down .scroller {
      fill: currentColor;
      animation: updown 2s infinite;
    }

    .home-content {
      display: flex;
      flex-direction: column;
      align-items: center;
    }

    @keyframes updown {
      0% {
        transform: translate(0, 0);
      }
      50% {
        transform: translate(0, 5px);
      }
      100% {
        transform: translate(0, 0);
      }
    }

    @media (min-height: 500px) {
      hero-block {
        height: calc(100vh + 57px);
        max-height: calc(100vh + 1px);
      }

      .home-content {
        margin-top: -48px;
      }

      .scroll-down {
        position: absolute;
        bottom: 24px;
        left: 50%;
        transform: translateX(-50%);
        z-index: 2;
      }
    }

    @media (min-width: 812px) {
      hero-block {
        height: calc(100vh + 65px);
      }

      .hero-logo {
        max-width: 320px;
      }

      .info-items {
        margin: 48px auto;
        font-size: 28px;
        line-height: 1.1;
      }
    }
  `;

  private readonly metadata = new PageMetadataController(this, 'home');
  private city = location.city;
  private get siteTitle() {
    return title;
  }
  private get dates() {
    return getEventDates();
  }
  private heroSettings = heroSettings.home;
  private get aboutBlock() {
    return aboutBlock;
  }

  @query('#hero')
  accessor hero!: HeroBlock;
  @query('#tickets-block')
  private accessor ticketsBlock!: HTMLElement;

  private playVideo = () => {
    openVideoDialog({
      title: this.aboutBlock.callToAction.howItWas.label,
      youtubeId: this.aboutBlock.callToAction.howItWas.youtubeId,
    });
  };

  private scrollToTickets = async () => {
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

  private scrollNextBlock = () => {
    scrollToElement(this.hero, POSITION.BOTTOM);
  };

  override firstUpdated() {
    this.observeLazyBlocks();
  }

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
    return html`
      <hero-block
        id="hero"
        background-image="${this.heroSettings.background.image}"
        background-color="var(--default-primary-color)"
        font-color="var(--text-primary-color)"
        hide-logo
      >
        <div class="home-content">
          <img class="hero-logo" src="/images/logo.svg" alt="${this.siteTitle}" decoding="async" />

          <div class="info-items">
            <div class="info-item">${this.city}. ${this.dates}</div>
            <div class="info-item">${heroDescriptions.home}</div>
          </div>

          <div class="action-buttons">
            <hb-button variant="outlined" class="watch-video" @click="${this.playVideo}">
              <hoverboard-icon name="movie" slot="icon"></hoverboard-icon>
              ${msg('View Highlights', { id: 'pages.home.view-highlights' })}
            </hb-button>
            ${
              __HB_FEATURES__.tickets
                ? html`
                    <hb-button class="buy-ticket" @click="${this.scrollToTickets}">
                      <hoverboard-icon name="ticket" slot="icon"></hoverboard-icon>
                      ${msg('Buy ticket', { id: 'common.buy-ticket' })}
                    </hb-button>
                  `
                : nothing
            }
          </div>

          <div class="scroll-down" @click="${this.scrollNextBlock}">
            <svg
              xmlns="http://www.w3.org/2000/svg"
              version="1.1"
              id="Layer_2"
              x="0px"
              y="0px"
              viewBox="0 0 25.166666 37.8704414"
              enable-background="new 0 0 25.166666 37.8704414"
              xml:space="preserve"
            >
              <path
                class="stroke"
                fill="none"
                stroke="currentColor"
                stroke-width="2.5"
                stroke-miterlimit="10"
                d="M12.5833445
                36.6204414h-0.0000229C6.3499947
                36.6204414
                1.25
                31.5204487
                1.25
                25.2871208V12.5833216C1.25
                6.3499947
                6.3499951
                1.25
                12.5833216
                1.25h0.0000229c6.2333269
                0
                11.3333216
                5.0999947
                11.3333216
                11.3333216v12.7037992C23.916666
                31.5204487
                18.8166714
                36.6204414
                12.5833445
                36.6204414z"
              ></path>
              <path
                class="scroller"
                fill="currentColor"
                d="M13.0833359
                19.2157116h-0.9192753c-1.0999985
                0-1.9999971-0.8999996-1.9999971-1.9999981v-5.428606c0-1.0999994
                0.8999987-1.9999981
                1.9999971-1.9999981h0.9192753c1.0999985
                0
                1.9999981
                0.8999987
                1.9999981
                1.9999981v5.428606C15.083334
                18.315712
                14.1833344
                19.2157116
                13.0833359
                19.2157116z"
              ></path>
            </svg>
            <i class="icon icon-arrow-down"></i>
          </div>
        </div>
      </hero-block>
      ${__HB_FEATURES__.forkMe ? html`<fork-me-block></fork-me-block>` : nothing}
      <about-block></about-block>
      ${__HB_FEATURES__.speakers ? html`<speakers-block></speakers-block>` : nothing}
      ${__HB_FEATURES__.subscribe ? html`<subscribe-block></subscribe-block>` : nothing}
      ${
        __HB_FEATURES__.tickets ? html`<tickets-block id="tickets-block"></tickets-block>` : nothing
      }
      ${__HB_FEATURES__.gallery ? html`<gallery-block></gallery-block>` : nothing}
      <about-organizer-block></about-organizer-block>
      ${__HB_FEATURES__.videos ? html`<featured-videos></featured-videos>` : nothing}
      ${__HB_FEATURES__.blog ? html`<latest-posts-block></latest-posts-block>` : nothing}
      ${__HB_FEATURES__.map ? html`<map-block></map-block>` : nothing}
      ${__HB_FEATURES__.partners ? html`<partners-block></partners-block>` : nothing}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
