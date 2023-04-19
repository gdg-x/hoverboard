import { customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import { html, PolymerElement } from '@polymer/polymer';
import '../components/about-block';
import '../elements/about-organizer-block';
import '../elements/fork-me-block';
import '../elements/gallery-block';
import '../elements/map-block';
import '../elements/subscribe-block';
import '../elements/tickets-block';
import { ReduxMixin } from '../mixins/redux-mixin';
import { RootState } from '../store';
import { toggleVideoDialog } from '../store/ui/actions';
import { Viewport } from '../store/ui/types';
import { TempAny } from '../temp-any';
import { scrollToY } from '../utils/scrolling';

@customElement('home-page')
export class HomePage extends ReduxMixin(PolymerElement) {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment">
        :host {
          display: block;
          height: 100%;
        }
        @keyframes backmove {
          50% {background-position: center;}
        }
        hero-block {
          font-size: 25px;
          text-align: center;
        }

        .hero-logo {
          --iron-image-width: 100%;
          max-width: max-content;
        }

        .info-items {
          margin: 24px auto;
          font-size: 22px;
          color: #000000;
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
          opacity: 1;
        }

        .scroll-down .stroke {
          stroke: #000000;
        }

        .scroll-down .scroller {
          fill: #000000;
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
            max-width: max-content;
          }

          .info-items {
            margin: 10px auto 35px auto;
            font-size: 28px;
            line-height: 1.1;
          }
        }
        .particle {
          position: absolute;
          border-radius: 50%;
        }
        
        @-webkit-keyframes particle-animation-1 {
          100% {
            transform: translate3d(62vw, 36vh, 85px);
          }
        }
        
        @keyframes particle-animation-1 {
          100% {
            transform: translate3d(62vw, 36vh, 85px);
          }
        }
        .particle:nth-child(1) {
          -webkit-animation: particle-animation-1 60s infinite;
                  animation: particle-animation-1 60s infinite;
          opacity: 0.16;
          height: 6px;
          width: 6px;
          -webkit-animation-delay: -0.2s;
                  animation-delay: -0.2s;
          transform: translate3d(83vw, 3vh, 62px);
          background: #4fc3f7;
        }
        
        @-webkit-keyframes particle-animation-2 {
          100% {
            transform: translate3d(50vw, 83vh, 79px);
          }
        }
        
        @keyframes particle-animation-2 {
          100% {
            transform: translate3d(50vw, 83vh, 79px);
          }
        }
        .particle:nth-child(2) {
          -webkit-animation: particle-animation-2 60s infinite;
                  animation: particle-animation-2 60s infinite;
          opacity: 0.43;
          height: 8px;
          width: 8px;
          -webkit-animation-delay: -0.4s;
                  animation-delay: -0.4s;
          transform: translate3d(87vw, 89vh, 79px);
          background: #4fc3f7;
        }
        
        @-webkit-keyframes particle-animation-3 {
          100% {
            transform: translate3d(57vw, 74vh, 42px);
          }
        }
        
        @keyframes particle-animation-3 {
          100% {
            transform: translate3d(57vw, 74vh, 42px);
          }
        }
        .particle:nth-child(3) {
          -webkit-animation: particle-animation-3 60s infinite;
                  animation: particle-animation-3 60s infinite;
          opacity: 0.53;
          height: 9px;
          width: 9px;
          -webkit-animation-delay: -0.6s;
                  animation-delay: -0.6s;
          transform: translate3d(41vw, 22vh, 82px);
          background: #26d6d9;
        }
        
        @-webkit-keyframes particle-animation-4 {
          100% {
            transform: translate3d(77vw, 84vh, 65px);
          }
        }
        
        @keyframes particle-animation-4 {
          100% {
            transform: translate3d(77vw, 84vh, 65px);
          }
        }
        .particle:nth-child(4) {
          -webkit-animation: particle-animation-4 60s infinite;
                  animation: particle-animation-4 60s infinite;
          opacity: 0.77;
          height: 6px;
          width: 6px;
          -webkit-animation-delay: -0.8s;
                  animation-delay: -0.8s;
          transform: translate3d(2vw, 72vh, 60px);
          background: #4fc3f7;
        }
        
        @-webkit-keyframes particle-animation-5 {
          100% {
            transform: translate3d(60vw, 82vh, 10px);
          }
        }
        
        @keyframes particle-animation-5 {
          100% {
            transform: translate3d(60vw, 82vh, 10px);
          }
        }
        .particle:nth-child(5) {
          -webkit-animation: particle-animation-5 60s infinite;
                  animation: particle-animation-5 60s infinite;
          opacity: 0.48;
          height: 10px;
          width: 10px;
          -webkit-animation-delay: -1s;
                  animation-delay: -1s;
          transform: translate3d(8vw, 40vh, 91px);
          background: #4fc3f7;
        }
        
        @-webkit-keyframes particle-animation-6 {
          100% {
            transform: translate3d(4vw, 36vh, 71px);
          }
        }
        
        @keyframes particle-animation-6 {
          100% {
            transform: translate3d(4vw, 36vh, 71px);
          }
        }
        .particle:nth-child(6) {
          -webkit-animation: particle-animation-6 60s infinite;
                  animation: particle-animation-6 60s infinite;
          opacity: 0.12;
          height: 6px;
          width: 6px;
          -webkit-animation-delay: -1.2s;
                  animation-delay: -1.2s;
          transform: translate3d(90vw, 42vh, 63px);
          background: #4fc3f7;
        }
        
        @-webkit-keyframes particle-animation-7 {
          100% {
            transform: translate3d(66vw, 77vh, 100px);
          }
        }
        
        @keyframes particle-animation-7 {
          100% {
            transform: translate3d(66vw, 77vh, 100px);
          }
        }
        .particle:nth-child(7) {
          -webkit-animation: particle-animation-7 60s infinite;
                  animation: particle-animation-7 60s infinite;
          opacity: 0.74;
          height: 10px;
          width: 10px;
          -webkit-animation-delay: -1.4s;
                  animation-delay: -1.4s;
          transform: translate3d(65vw, 58vh, 41px);
          background: #32b6d2;
        }
        
        @-webkit-keyframes particle-animation-8 {
          100% {
            transform: translate3d(44vw, 75vh, 67px);
          }
        }
        
        @keyframes particle-animation-8 {
          100% {
            transform: translate3d(44vw, 75vh, 67px);
          }
        }
        .particle:nth-child(8) {
          -webkit-animation: particle-animation-8 60s infinite;
                  animation: particle-animation-8 60s infinite;
          opacity: 0.44;
          height: 8px;
          width: 8px;
          -webkit-animation-delay: -1.6s;
                  animation-delay: -1.6s;
          transform: translate3d(46vw, 74vh, 53px);
          background: #26d9b8;
        }
        
        @-webkit-keyframes particle-animation-9 {
          100% {
            transform: translate3d(63vw, 46vh, 100px);
          }
        }
        
        @keyframes particle-animation-9 {
          100% {
            transform: translate3d(63vw, 46vh, 100px);
          }
        }
        .particle:nth-child(9) {
          -webkit-animation: particle-animation-9 60s infinite;
                  animation: particle-animation-9 60s infinite;
          opacity: 0.26;
          height: 7px;
          width: 7px;
          -webkit-animation-delay: -1.8s;
                  animation-delay: -1.8s;
          transform: translate3d(11vw, 49vh, 66px);
          background: #32b6d2;
        }
        
        @-webkit-keyframes particle-animation-10 {
          100% {
            transform: translate3d(10vw, 51vh, 63px);
          }
        }
        
        @keyframes particle-animation-10 {
          100% {
            transform: translate3d(10vw, 51vh, 63px);
          }
        }
        .particle:nth-child(10) {
          -webkit-animation: particle-animation-10 60s infinite;
                  animation: particle-animation-10 60s infinite;
          opacity: 0.97;
          height: 9px;
          width: 9px;
          -webkit-animation-delay: -2s;
                  animation-delay: -2s;
          transform: translate3d(59vw, 71vh, 58px);
          background: #32b6d2;
        }
        
        @-webkit-keyframes particle-animation-11 {
          100% {
            transform: translate3d(85vw, 45vh, 56px);
          }
        }
        
        @keyframes particle-animation-11 {
          100% {
            transform: translate3d(85vw, 45vh, 56px);
          }
        }
        .particle:nth-child(11) {
          -webkit-animation: particle-animation-11 60s infinite;
                  animation: particle-animation-11 60s infinite;
          opacity: 0.98;
          height: 9px;
          width: 9px;
          -webkit-animation-delay: -2.2s;
                  animation-delay: -2.2s;
          transform: translate3d(2vw, 65vh, 57px);
          background: #32b6d2;
        }
        
        @-webkit-keyframes particle-animation-12 {
          100% {
            transform: translate3d(42vw, 68vh, 79px);
          }
        }
        
        @keyframes particle-animation-12 {
          100% {
            transform: translate3d(42vw, 68vh, 79px);
          }
        }
        .particle:nth-child(12) {
          -webkit-animation: particle-animation-12 60s infinite;
                  animation: particle-animation-12 60s infinite;
          opacity: 0.87;
          height: 9px;
          width: 9px;
          -webkit-animation-delay: -2.4s;
                  animation-delay: -2.4s;
          transform: translate3d(62vw, 37vh, 94px);
          background: #32b6d2;
        }
        
        @-webkit-keyframes particle-animation-13 {
          100% {
            transform: translate3d(17vw, 65vh, 36px);
          }
        }
        
        @keyframes particle-animation-13 {
          100% {
            transform: translate3d(17vw, 65vh, 36px);
          }
        }
        .particle:nth-child(13) {
          -webkit-animation: particle-animation-13 60s infinite;
                  animation: particle-animation-13 60s infinite;
          opacity: 0.38;
          height: 6px;
          width: 6px;
          -webkit-animation-delay: -2.6s;
                  animation-delay: -2.6s;
          transform: translate3d(23vw, 19vh, 15px);
          background: #32b6d2;
        }
        
        @-webkit-keyframes particle-animation-14 {
          100% {
            transform: translate3d(39vw, 52vh, 16px);
          }
        }
        
        @keyframes particle-animation-14 {
          100% {
            transform: translate3d(39vw, 52vh, 16px);
          }
        }
        .particle:nth-child(14) {
          -webkit-animation: particle-animation-14 60s infinite;
                  animation: particle-animation-14 60s infinite;
          opacity: 0.31;
          height: 9px;
          width: 9px;
          -webkit-animation-delay: -2.8s;
                  animation-delay: -2.8s;
          transform: translate3d(10vw, 3vh, 51px);
          background: #32b6d2;
        }
        
        @-webkit-keyframes particle-animation-15 {
          100% {
            transform: translate3d(58vw, 10vh, 20px);
          }
        }
        
        @keyframes particle-animation-15 {
          100% {
            transform: translate3d(58vw, 10vh, 20px);
          }
        }
        .particle:nth-child(15) {
          -webkit-animation: particle-animation-15 60s infinite;
                  animation: particle-animation-15 60s infinite;
          opacity: 0.33;
          height: 6px;
          width: 6px;
          -webkit-animation-delay: -3s;
                  animation-delay: -3s;
          transform: translate3d(46vw, 2vh, 57px);
          background: #3061bd;
        }
        
        @-webkit-keyframes particle-animation-16 {
          100% {
            transform: translate3d(85vw, 17vh, 93px);
          }
        }
        
        @keyframes particle-animation-16 {
          100% {
            transform: translate3d(85vw, 17vh, 93px);
          }
        }
        .particle:nth-child(16) {
          -webkit-animation: particle-animation-16 60s infinite;
                  animation: particle-animation-16 60s infinite;
          opacity: 0.27;
          height: 9px;
          width: 9px;
          -webkit-animation-delay: -3.2s;
                  animation-delay: -3.2s;
          transform: translate3d(37vw, 2vh, 3px);
          background: #3061bd;
        }
        
        @-webkit-keyframes particle-animation-17 {
          100% {
            transform: translate3d(62vw, 80vh, 47px);
          }
        }
        
        @keyframes particle-animation-17 {
          100% {
            transform: translate3d(62vw, 80vh, 47px);
          }
        }
        .particle:nth-child(17) {
          -webkit-animation: particle-animation-17 60s infinite;
                  animation: particle-animation-17 60s infinite;
          opacity: 0.27;
          height: 7px;
          width: 7px;
          -webkit-animation-delay: -3.4s;
                  animation-delay: -3.4s;
          transform: translate3d(62vw, 79vh, 27px);
          background: #3061bd;
        }
        
        @-webkit-keyframes particle-animation-18 {
          100% {
            transform: translate3d(5vw, 51vh, 99px);
          }
        }
        
        @keyframes particle-animation-18 {
          100% {
            transform: translate3d(5vw, 51vh, 99px);
          }
        }
        .particle:nth-child(18) {
          -webkit-animation: particle-animation-18 60s infinite;
                  animation: particle-animation-18 60s infinite;
          opacity: 0.67;
          height: 7px;
          width: 7px;
          -webkit-animation-delay: -3.6s;
                  animation-delay: -3.6s;
          transform: translate3d(56vw, 24vh, 1px);
          background: #3061bd;
        }
        
        @-webkit-keyframes particle-animation-19 {
          100% {
            transform: translate3d(68vw, 40vh, 6px);
          }
        }
        
        @keyframes particle-animation-19 {
          100% {
            transform: translate3d(68vw, 40vh, 6px);
          }
        }
        .particle:nth-child(19) {
          -webkit-animation: particle-animation-19 60s infinite;
                  animation: particle-animation-19 60s infinite;
          opacity: 0.68;
          height: 10px;
          width: 10px;
          -webkit-animation-delay: -3.8s;
                  animation-delay: -3.8s;
          transform: translate3d(59vw, 79vh, 58px);
          background: #3061bd;
        }
        
        @-webkit-keyframes particle-animation-20 {
          100% {
            transform: translate3d(48vw, 13vh, 29px);
          }
        }
        
        @keyframes particle-animation-20 {
          100% {
            transform: translate3d(48vw, 13vh, 29px);
          }
        }
        .particle:nth-child(20) {
          -webkit-animation: particle-animation-20 60s infinite;
                  animation: particle-animation-20 60s infinite;
          opacity: 0.47;
          height: 10px;
          width: 10px;
          -webkit-animation-delay: -4s;
                  animation-delay: -4s;
          transform: translate3d(18vw, 70vh, 77px);
          background: #26a3d9;
        }
        
        @-webkit-keyframes particle-animation-21 {
          100% {
            transform: translate3d(14vw, 71vh, 44px);
          }
        }
        
        @keyframes particle-animation-21 {
          100% {
            transform: translate3d(14vw, 71vh, 44px);
          }
        }
        .particle:nth-child(21) {
          -webkit-animation: particle-animation-21 60s infinite;
                  animation: particle-animation-21 60s infinite;
          opacity: 0.1;
          height: 9px;
          width: 9px;
          -webkit-animation-delay: -4.2s;
                  animation-delay: -4.2s;
          transform: translate3d(72vw, 2vh, 52px);
          background: #4fc3f7;
        }
        
        @-webkit-keyframes particle-animation-22 {
          100% {
            transform: translate3d(63vw, 8vh, 15px);
          }
        }
        
        @keyframes particle-animation-22 {
          100% {
            transform: translate3d(63vw, 8vh, 15px);
          }
        }
        .particle:nth-child(22) {
          -webkit-animation: particle-animation-22 60s infinite;
                  animation: particle-animation-22 60s infinite;
          opacity: 0.43;
          height: 9px;
          width: 9px;
          -webkit-animation-delay: -4.4s;
                  animation-delay: -4.4s;
          transform: translate3d(47vw, 77vh, 96px);
          background: #4fc3f7;
        }
        
        @-webkit-keyframes particle-animation-23 {
          100% {
            transform: translate3d(6vw, 55vh, 9px);
          }
        }
        
        @keyframes particle-animation-23 {
          100% {
            transform: translate3d(6vw, 55vh, 9px);
          }
        }
        .particle:nth-child(23) {
          -webkit-animation: particle-animation-23 60s infinite;
                  animation: particle-animation-23 60s infinite;
          opacity: 0.28;
          height: 8px;
          width: 8px;
          -webkit-animation-delay: -4.6s;
                  animation-delay: -4.6s;
          transform: translate3d(11vw, 38vh, 11px);
          background: #4fc3f7;
        }
        
        @-webkit-keyframes particle-animation-24 {
          100% {
            transform: translate3d(30vw, 54vh, 81px);
          }
        }
        
        @keyframes particle-animation-24 {
          100% {
            transform: translate3d(30vw, 54vh, 81px);
          }
        }
        .particle:nth-child(24) {
          -webkit-animation: particle-animation-24 60s infinite;
                  animation: particle-animation-24 60s infinite;
          opacity: 0.8;
          height: 7px;
          width: 7px;
          -webkit-animation-delay: -4.8s;
                  animation-delay: -4.8s;
          transform: translate3d(85vw, 37vh, 87px);
          background: #2650d9;
        }
        
        @-webkit-keyframes particle-animation-25 {
          100% {
            transform: translate3d(26vw, 50vh, 46px);
          }
        }
        
        @keyframes particle-animation-25 {
          100% {
            transform: translate3d(26vw, 50vh, 46px);
          }
        }
        .particle:nth-child(25) {
          -webkit-animation: particle-animation-25 60s infinite;
                  animation: particle-animation-25 60s infinite;
          opacity: 0.72;
          height: 6px;
          width: 6px;
          -webkit-animation-delay: -5s;
                  animation-delay: -5s;
          transform: translate3d(53vw, 39vh, 78px);
          background: #4fc3f7;
        }
        
        @-webkit-keyframes particle-animation-26 {
          100% {
            transform: translate3d(10vw, 78vh, 78px);
          }
        }
        
        @keyframes particle-animation-26 {
          100% {
            transform: translate3d(10vw, 78vh, 78px);
          }
        }
        .particle:nth-child(26) {
          -webkit-animation: particle-animation-26 60s infinite;
                  animation: particle-animation-26 60s infinite;
          opacity: 0.28;
          height: 6px;
          width: 6px;
          -webkit-animation-delay: -5.2s;
                  animation-delay: -5.2s;
          transform: translate3d(20vw, 54vh, 18px);
          background: #4fc3f7;
        }
        
        @-webkit-keyframes particle-animation-27 {
          100% {
            transform: translate3d(56vw, 37vh, 93px);
          }
        }
        
        @keyframes particle-animation-27 {
          100% {
            transform: translate3d(56vw, 37vh, 93px);
          }
        }
        .particle:nth-child(27) {
          -webkit-animation: particle-animation-27 60s infinite;
                  animation: particle-animation-27 60s infinite;
          opacity: 0.4;
          height: 9px;
          width: 9px;
          -webkit-animation-delay: -5.4s;
                  animation-delay: -5.4s;
          transform: translate3d(12vw, 90vh, 80px);
          background: #5cd926;
        }
        
        @-webkit-keyframes particle-animation-28 {
          100% {
            transform: translate3d(2vw, 3vh, 70px);
          }
        }
        
        @keyframes particle-animation-28 {
          100% {
            transform: translate3d(2vw, 3vh, 70px);
          }
        }
        .particle:nth-child(28) {
          -webkit-animation: particle-animation-28 60s infinite;
                  animation: particle-animation-28 60s infinite;
          opacity: 0.43;
          height: 8px;
          width: 8px;
          -webkit-animation-delay: -5.6s;
                  animation-delay: -5.6s;
          transform: translate3d(38vw, 17vh, 86px);
          background: #1ce9b6;
        }
        
        @-webkit-keyframes particle-animation-29 {
          100% {
            transform: translate3d(65vw, 34vh, 24px);
          }
        }
        
        @keyframes particle-animation-29 {
          100% {
            transform: translate3d(65vw, 34vh, 24px);
          }
        }
        .particle:nth-child(29) {
          -webkit-animation: particle-animation-29 60s infinite;
                  animation: particle-animation-29 60s infinite;
          opacity: 0.56;
          height: 6px;
          width: 6px;
          -webkit-animation-delay: -5.8s;
                  animation-delay: -5.8s;
          transform: translate3d(66vw, 16vh, 6px);
          background: #1ce9b6;
        }
        
        @-webkit-keyframes particle-animation-30 {
          100% {
            transform: translate3d(20vw, 36vh, 98px);
          }
        }
        
        @keyframes particle-animation-30 {
          100% {
            transform: translate3d(20vw, 36vh, 98px);
          }
        }
        .particle:nth-child(30) {
          -webkit-animation: particle-animation-30 60s infinite;
                  animation: particle-animation-30 60s infinite;
          opacity: 0.16;
          height: 10px;
          width: 10px;
          -webkit-animation-delay: -6s;
                  animation-delay: -6s;
          transform: translate3d(64vw, 70vh, 76px);
          background: #1ce9b6;
        }
      </style>

      <polymer-helmet active="[[active]]"></polymer-helmet>
      
      <hero-block
        id="hero"
        background-image="{$ heroSettings.home.background.image $}"
        background-color="{$ heroSettings.home.background.color $}"
        font-color="{$ heroSettings.home.fontColor $}"
        active="[[active]]"
        hide-logo
      > 
        <div class="home-content" layout vertical center>
          <plastic-image
            class="hero-logo"
            srcset="/images/LogoHero2023-1.png"
            alt="{$ title $}"
          ></plastic-image>
          <div class="info-items">
            <div class="info-item">{$ location.city $}. {$ dates $}</div>
            <div class="info-item">{$ heroSettings.home.description $}</div>
          </div>
          <div class="action-buttons" layout horizontal center-justified wrap>
          <a
            target="_blank"
            rel="noopener noreferrer"
            href="{$ organizer.url $}"
          >
          <paper-button
              primary
            >
              <iron-icon icon="hoverboard:ticket"></iron-icon>
              {$ buyTicket $}
            </paper-button>
          </a>
          </div>

          <div class="scroll-down" on-click="_scrollNextBlock">
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
                stroke="#000000"
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
                fill="#000000"
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
      {% if showForkMeBlockForProjectIds.includes(firebase.projectId) %}
      <fork-me-block></fork-me-block>
      {% endif %}
      <about-block></about-block>
      <gallery-block></gallery-block>
      <about-organizer-block></about-organizer-block>
      <footer-block></footer-block>
    `;
  }

  @property({ type: Boolean })
  private active = false;
  @property({ type: Object })
  private viewport: Viewport;

  stateChanged(state: RootState) {
    this.viewport = state.ui.viewport;
  }

  _playVideo() {
    toggleVideoDialog({
      title: '{$  aboutBlock.callToAction.howItWas.label $}',
      youtubeId: '{$  aboutBlock.callToAction.howItWas.youtubeId $}',
      disableControls: true,
      opened: true,
    });
  }

  _scrollToTickets() {
    const Elements = (window as TempAny).HOVERBOARD.Elements;
    const toolbarHeight = Elements.HeaderToolbar.getBoundingClientRect().height - 1;
    const ticketsBlockPositionY = Elements.Tickets.getBoundingClientRect().top - toolbarHeight;
    scrollToY(ticketsBlockPositionY, 600, 'easeInOutSine');
  }

  _scrollNextBlock() {
    const heroHeight = this.$.hero.getBoundingClientRect().height - 64;
    scrollToY(heroHeight, 600, 'easeInOutSine');
  }
}
