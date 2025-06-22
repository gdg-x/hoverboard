import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import '@power-elements/lazy-image';
import { codeOfConduct, organizer } from '../utils/data';
import { ThemedElement } from '../components/themed-element';

@customElement('footer-nav')
export class FooterNav extends ThemedElement {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          margin: 0 20px;
        }

        .copyright {
          padding: 15px 0 0;
          float: left;
        }

        .coc {
          display: block;
        }

        .nav-inline {
          list-style: none;
          margin: 0;
          padding: 0;
        }

        .footer-logo {
          --lazy-image-width: 120px;
          --lazy-image-height: 24px;
          --lazy-image-fit: contain;
          width: var(--lazy-image-width);
          height: var(--lazy-image-height);
          margin: 10px 30px 0 0;
          float: left;
        }

        a {
          color: var(--footer-text-color);
          padding-bottom: 2px;
          text-decoration: none;
        }

        a:hover {
          text-decoration: underline;
        }

        @media (min-width: 768px) {
          :host {
            margin: 15px 0;
          }
        }

        @media (min-width: 505px) {
          .copyright {
            margin: 0;
            padding: 15px 0 0 0;
            float: right;
            text-align: right;
          }

          .coc {
            display: inline-flex;
          }
        }
      `,
    ];
  }

  override render() {
    return html`
      <div class="nav-inline" layout flex>
        <a href="${this.organizer.url}" target="_blank" rel="noopener noreferrer">
          <lazy-image
            class="footer-logo"
            src="../../images/organizer-logo.svg"
            alt="${this.organizer.name}"
          ></lazy-image>
        </a>

        <div class="copyright">
          Based on
          <a href="https://github.com/gdg-x/hoverboard" target="_blank" rel="noopener noreferrer"
            >Project Hoverboard</a
          >
          · <a class="coc" href="/coc">${this.codeOfConduct}</a>
        </div>
      </div>
    `;
  }

  @property({ type: Object })
  private organizer = organizer;

  @property()
  private codeOfConduct = codeOfConduct;
}
