import '@material/web/button/filled-button.js';
import '@material/web/button/outlined-button.js';
import '@power-elements/lazy-image';
import { css, html, nothing } from 'lit';
import { customElement, query, state } from 'lit/decorators.js';
import '../components/about-block';
import '../components/about-organizer-block';
import '../components/featured-videos';
import '../components/footer-block';
import '../components/fork-me-block';
import '../components/gallery-block';
import '../components/hero/hero-block';
import { HeroBlock } from '../components/hero/hero-block';
import '../components/hoverboard-icon';
import '../components/latest-posts-block';
import '../components/map-block';
import '../components/partners-block';
import '../components/speakers-block';
import '../components/subscribe-block';
import { ThemedElement } from '../components/themed-element';
import '../components/tickets-block';
import { firebaseApp } from '../firebase';
import { store } from '../store';
import { ReduxMixin } from '../store/mixin';
import { queueSnackbar } from '../store/snackbars';
import { openVideoDialog } from '../store/ui/actions';
import {
  aboutBlock,
  buyTicket,
  dates,
  description,
  heroSettings,
  location,
  showForkMeBlockForProjectIds,
  title,
  viewHighlights,
} from '../utils/data';
import { INCLUDE_SITE_TITLE, updateMetadata } from '../utils/metadata';
import { POSITION, scrollToElement } from '../utils/scrolling';

@customElement('home-page')
export class HomePage extends ReduxMixin(ThemedElement) {
  static override get styles() {
    return [
      ...super.styles,
      css`
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
        }

        .action-buttons md-filled-button,
        .action-buttons md-outlined-button {
          margin: 8px;
        }

        .action-buttons .watch-video {
          color: #fff;
          --md-outlined-button-label-text-color: #fff;
          --md-outlined-button-hover-label-text-color: #fff;
          --md-outlined-button-outline-color: #fff;
        }

        .action-buttons hoverboard-icon {
          margin-right: 8px;
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
      `,
    ];
  }

  private city = location.city;
  private siteTitle = title;
  private dates = dates;
  private viewHighlights = viewHighlights;
  private buyTicket = buyTicket;
  private heroSettings = heroSettings.home;
  private aboutBlock = aboutBlock;

  @query('#hero')
  hero!: HeroBlock;
  @query('#tickets-block')
  private ticketsBlock!: HTMLElement;

  @state()
  private showForkMeBlock: boolean = false;

  private playVideo() {
    openVideoDialog({
      title: this.aboutBlock.callToAction.howItWas.label,
      youtubeId: this.aboutBlock.callToAction.howItWas.youtubeId,
    });
  }

  private scrollToTickets() {
    const element = this.ticketsBlock;
    if (element) {
      scrollToElement(element);
    } else {
      store.dispatch(queueSnackbar('Error scrolling to section.'));
    }
  }

  private scrollNextBlock() {
    scrollToElement(this.hero, POSITION.BOTTOM);
  }

  private shouldShowForkMeBlock(): boolean {
    const showForkMeBlock = firebaseApp.options.appId
      ? showForkMeBlockForProjectIds.includes(firebaseApp.options.appId)
      : false;
    if (showForkMeBlock) {
      import('../components/fork-me-block');
    }
    return showForkMeBlock;
  }

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(title, description, INCLUDE_SITE_TITLE.NO);
    this.showForkMeBlock = this.shouldShowForkMeBlock();
  }

  override render() {
    return html`
      <hero-block
        id="hero"
        background-image="${this.heroSettings.background.image}"
        background-color="${this.heroSettings.background.color}"
        font-color="${this.heroSettings.fontColor}"
        hide-logo
      >
        <div class="home-content" layout vertical center>
          <lazy-image class="hero-logo" src="/images/logo.svg" alt="${this.siteTitle}"></lazy-image>

          <div class="info-items">
            <div class="info-item">${this.city}. ${this.dates}</div>
            <div class="info-item">${this.heroSettings.description}</div>
          </div>

          <div class="action-buttons" layout horizontal center-justified wrap>
            <md-outlined-button class="watch-video" @click="${this.playVideo}">
              <hoverboard-icon name="movie" slot="icon"></hoverboard-icon>
              ${this.viewHighlights}
            </md-outlined-button>
            <md-filled-button @click="${this.scrollToTickets}">
              <hoverboard-icon name="ticket" slot="icon"></hoverboard-icon>
              ${this.buyTicket}
            </md-filled-button>
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
                stroke="#c7c4b8"
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
                fill="#c7c4b8"
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
      ${this.showForkMeBlock ? html`<fork-me-block></fork-me-block>` : nothing}
      <about-block></about-block>
      <speakers-block></speakers-block>
      <subscribe-block></subscribe-block>
      <tickets-block id="tickets-block"></tickets-block>
      <gallery-block></gallery-block>
      <about-organizer-block></about-organizer-block>
      <featured-videos></featured-videos>
      <latest-posts-block></latest-posts-block>
      <map-block></map-block>
      <partners-block></partners-block>
      <footer-block></footer-block>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'home-page': HomePage;
  }
}
