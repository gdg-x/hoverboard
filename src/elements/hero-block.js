import { html, PolymerElement } from '@polymer/polymer';
import 'plastic-image';
import { uiActions } from '../redux/actions.js';
import './shared-styles.js';

class HeroBlock extends PolymerElement {
  static get template() {
    return html`
    <style include="shared-styles flex flex-alignment positioning">
      :host {
        margin-top: -56px;
        display: block;
        border-bottom: 1px solid var(--divider-color);
      }

      .hero-block {
        height: 100%;
        position: relative;
        color: inherit;
      }

      .hero-overlay {
        background-color: rgba(0, 0, 0, 0.6);
        opacity: 0;
        transition: opacity 0.3s;
        position: absolute;
      }

      .hero-overlay[show] {
        opacity: 1;
      }

      .hero-image {
        transition: background-color 0.3s;
        position: absolute;
      }

      .container {
        padding: 0;
        width: 100%;
        height: unset;
        z-index: 0;
        position: unset;
      }

      .hero-content {
        padding: 80px 32px 32px;
        position: unset;
      }

      div ::slotted(.hero-title) {
        margin: 30px 0;
        font-size: 40px;
      }

      div ::slotted(.hero-description) {
        margin-bottom: 30px;
        max-width: 600px;
      }

      @media (min-width: 812px) {
        :host {
          margin-top: -64px;
        }

        .hero-content {
          padding-top: 120px;
          padding-bottom: 60px;
        }
      }

    </style>

    <div class="hero-block" style$="color: [[fontColor]]" layout start vertical center-justified>
      <plastic-image
        class="hero-image"
        srcset="[[backgroundImage]]"
        style$="background-color: [[backgroundColor]]"
        sizing="cover"
        lazy-load
        preload
        fade
        fit></plastic-image>
      <div class="hero-overlay" show$="[[_showOverlay(backgroundImage)]]" fit></div>
      <div class="container">
        <div class="hero-content">
          <slot></slot>
        </div>
      </div>
    </div>
    <slot name="bottom"></slot>
`;
  }

  static get is() {
    return 'hero-block';
  }

  static get properties() {
    return {
      active: Boolean,
      backgroundImage: String,
      backgroundColor: String,
      fontColor: String,
      hideLogo: Boolean,
    };
  }

  static get observers() {
    return [
      '_setState(active, backgroundImage, backgroundColor, fontColor, hideLogo)',
    ];
  }

  _showOverlay(backgroundImage) {
    return !!backgroundImage;
  }

  _setState(active, backgroundImage, backgroundColor, fontColor, hideLogo) {
    if (active) {
      uiActions.setHeroSettings({
        backgroundImage,
        backgroundColor,
        fontColor,
        hideLogo,
      });
    }
  }
}

window.customElements.define(HeroBlock.is, HeroBlock);
