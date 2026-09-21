import '@material/web/iconbutton/icon-button.js';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { share } from '../utils/share';
import {
  emailUs,
  followOur,
  followUs,
  footer,
  mailto,
  organizer,
  socialNetwork,
} from '../utils/data';
import { ThemedElement } from './themed-element';
import './hoverboard-icon';

@customElement('footer-social')
export class FooterSocial extends ThemedElement {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          padding-left: 4px;
          margin: 0 20px 0 20px;
          display: block;
        }

        .title {
          display: inline-block;
          text-transform: uppercase;
          font-weight: 500;
          margin: 0;
          color: var(--footer-text-color);
        }

        .nav-inline li a {
          padding: 0;
        }

        .nav-inline {
          display: inline;
          margin: 0 55px 0 4px;
        }

        ul.nav-inline {
          padding-left: 10px;
        }

        .nav-inline li {
          display: inline-block;
        }

        .social-group.share-block {
          margin-bottom: 17px;
        }

        .share {
          height: 30px;
          padding: 8px;
          width: 35px;
          display: inline-block;
          margin: 0;
        }

        .share-twitter {
          color: var(--twitter-color);
        }

        .share-facebook {
          color: var(--facebook-color);
        }

        a {
          display: inline-block;
          margin: 0;
          color: var(--footer-text-color);
          text-decoration: none;
        }

        .social-group {
          margin-right: 0;
          margin-bottom: 10px;
          padding-top: 0;
        }

        .email {
          margin-bottom: 20px;
          width: 85px;
        }

        .email .title {
          padding-right: 0;
          padding-top: 17px;
        }

        .email a {
          border-bottom: 1px solid var(--footer-text-color);
          padding-bottom: 1px;
        }

        .social-networks {
          margin-bottom: -10px;
        }

        .social-networks,
        .blog {
          padding-top: 0;
        }

        .social-networks ul {
          list-style-type: disc;
        }

        .blog .title {
          padding-right: 55px;
        }

        .blog a {
          border-bottom: 1px solid var(--footer-text-color);
          padding-bottom: 1px;
        }

        @media (min-width: 768px) {
          :host {
            margin: 15px 0;
          }
        }

        @media (min-width: 439px) {
          :host {
            display: inline-flex;
          }

          .social-group,
          .social-networks,
          .email {
            margin-bottom: 0;
          }

          .social-group {
            margin-right: 0;
          }

          .social-networks {
            padding-top: 8px;
          }

          .blog {
            padding-top: 17px;
          }
        }
      `,
    ];
  }

  @property({ type: Object })
  private socialNetwork = socialNetwork;
  @property()
  private followOur = followOur;
  @property()
  private followUs = followUs;
  @property()
  private emailUs = emailUs;
  @property()
  private mailto = mailto;
  @property({ type: Object })
  private organizer = organizer;
  @property({ type: Object })
  private footer = footer;
  @property({ type: Boolean })
  private blogNewTab = organizer.blog.startsWith('http');

  override render() {
    return html`
      <div class="social-group share-block">
        <!-- No label text: matches legacy behavior where the "share" resource key never
             existed, leaving this title empty. -->
        <div class="title"></div>
        <div class="nav-inline">
          <div class="share">
            <md-icon-button
              class="share-facebook"
              aria-label="Share on Facebook"
              share="facebook"
              @click="${this.share}"
            >
              <hoverboard-icon name="facebook"></hoverboard-icon>
            </md-icon-button>
          </div>
          <div class="share">
            <md-icon-button
              class="share-twitter"
              aria-label="Share on Twitter"
              share="twitter"
              @click="${this.share}"
            >
              <hoverboard-icon name="twitter"></hoverboard-icon>
            </md-icon-button>
          </div>
        </div>
      </div>

      <div class="social-group blog">
        <div class="title">
          ${this.followOur}
          <a
            href="${this.organizer.blog}"
            target="${this.blogNewTab ? '_blank' : nothing}"
            rel="${this.blogNewTab ? 'noopener noreferrer' : nothing}"
          >
            ${this.footer.blog}
          </a>
        </div>
      </div>

      <div class="social-group social-networks">
        <div class="title">${this.followUs}</div>
        <ul class="nav-inline">
          ${this.socialNetwork.follow.map(
            (socFollow) => html`
              <li>
                <a href="${socFollow.url}" target="_blank" rel="noopener noreferrer">
                  <md-icon-button aria-label="${socFollow.name}">
                    <hoverboard-icon name="${socFollow.name}"></hoverboard-icon>
                  </md-icon-button>
                </a>
              </li>
            `,
          )}
        </ul>
      </div>

      <div class="social-group email">
        <div class="title">
          <a aria-label="${this.emailUs}" href="mailto:${this.mailto}">${this.emailUs}</a>
        </div>
      </div>
    `;
  }

  private share(e: PointerEvent) {
    share(e);
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'footer-social': FooterSocial;
  }
}
