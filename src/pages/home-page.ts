import { customElement, property, query } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import '@power-elements/lazy-image';
import '../components/about-block';
import '../components/hero/hero-block';
import { HeroBlock } from '../components/hero/hero-block';
import '../elements/about-organizer-block';
import '../elements/about-conference-block';
import '../elements/fork-me-block';
import '../elements/gallery-block';
import '../elements/map-block';
import '../elements/partners-block';
import '../elements/subscribe-block';
import '../elements/tickets-block';
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
import '../utils/icons';
import { INCLUDE_SITE_TITLE, updateMetadata } from '../utils/metadata';
import { POSITION, scrollToElement } from '../utils/scrolling';

@customElement('home-page')
export class HomePage extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
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
          --lazy-image-height: 320px;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
          max-width: 320px;
          max-height: 320px;
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

        .action-buttons paper-button {
          margin: 8px;
        }

        .action-buttons .watch-video {
          color: #fff;
        }

        .action-buttons iron-icon {
          --iron-icon-fill-color: currentColor;
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
      </style>

      <hero-block
        id="hero"
        background-image="[[heroSettings.background.image]]"
        background-color="[[heroSettings.background.color]]"
        font-color="[[heroSettings.fontColor]]"
        hide-logo
      >
        <div class="home-content" layout vertical center>
          <lazy-image class="hero-logo" src="/images/logo.svg" alt="[[siteTitle]]"></lazy-image>

          <div class="info-items">
            <div class="info-item">[[heroSettings.catchingPhrase]]</div>
            <div class="info-item">[[heroSettings.description]]</div>
          </div>

          <div class="action-buttons" layout horizontal center-justified wrap>

<!--            <a-->
<!--              href="https://www.youtube.com/c/SunnyTechMtp"-->
<!--              target="_blank"-->
<!--            >-->
<!--              <paper-button class="watch-video" on-click="playVideo" primary>-->
<!--                <iron-icon icon="hoverboard:movie"></iron-icon>-->
<!--                [[viewHighlights]]-->
<!--              </paper-button>-->
<!--            </a>-->

            <a href$="[[heroSettings.callToAction.link]]" target="_blank" rel="noopener noreferrer">
              <paper-button class="buy-button" primary>[[heroSettings.callToAction.label]]</paper-button>
            </a>

            <!-- <a
              href="/schedule"
            >
              <paper-button  primary>
                Programme
              </paper-button>
            </a>
            -->
<!--            <paper-button on-click="scrollToTickets" primary invert>-->
<!--              <iron-icon icon="hoverboard:ticket"></iron-icon>-->
<!--              [[buyTicket]]-->
<!--            </paper-button>-->
          </div>

          <div class="scroll-down" on-click="scrollNextBlock">
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
      <template is="dom-if" if="{{showForkMeBlock}}">
        <fork-me-block></fork-me-block>
      </template>
      <about-block></about-block>
<!--      <about-conference-block></about-conference-block>-->
<!--      <speakers-block></speakers-block>-->
      <subscribe-block></subscribe-block>
<!--      <tickets-block id="tickets"></tickets-block>-->
      <gallery-block></gallery-block>
      <about-organizer-block></about-organizer-block>
<!--      <featured-videos></featured-videos>-->
<!--      <latest-posts-block></latest-posts-block>-->
      <partners-block></partners-block>
      <map-block></map-block>
      <footer-block></footer-block>
    `;
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

  @property({ type: Boolean })
  private showForkMeBlock: boolean = false;

  private playVideo() {
    openVideoDialog({
      title: this.aboutBlock.callToAction.howItWas.label,
      youtubeId: this.aboutBlock.callToAction.howItWas.youtubeId,
    });
  }

  private scrollToTickets() {
    const element = this.$['tickets-block'];
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
      import('../elements/fork-me-block');
    }
    return showForkMeBlock;
  }

  override connectedCallback() {
    super.connectedCallback();
    updateMetadata(title, description, INCLUDE_SITE_TITLE.NO);
    this.showForkMeBlock = this.shouldShowForkMeBlock();
  }
}
