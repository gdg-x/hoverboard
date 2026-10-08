import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { share } from '../../utils/share';
import { mailto, organizer, socialNetwork } from '../../config/site';
import { ThemedElement } from '../themed-element';
import '../shared/hoverboard-icon';
import '../ui/hb-icon-button';

@customElement('footer-social')
export class FooterSocial extends ThemedElement {
  static override styles = css`
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
      display: flex;
      align-items: center;
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
        padding-top: 0;
      }

      .blog {
        padding-top: 0;
      }
    }
  `;

  private socialNetwork = socialNetwork;
  private mailto = mailto;
  private organizer = organizer;
  private blogNewTab = organizer.blog?.startsWith('http') ?? false;

  override render() {
    const emailUs = msg('Email us', { id: 'footer.social.email-us' });
    const { blog } = this.organizer;
    const target = this.blogNewTab ? '_blank' : nothing;
    const rel = this.blogNewTab ? 'noopener noreferrer' : nothing;
    return html`
      <div class="social-group share-block">
        <!-- No label text: matches legacy behavior where the "share" resource key never
             existed, leaving this title empty. -->
        <div class="title"></div>
        <div class="nav-inline">
          <div class="share">
            <hb-icon-button
              class="share-facebook"
              label="${this.shareLabel('Facebook')}"
              share="facebook"
              @click="${this.share}"
            >
              <hoverboard-icon name="facebook"></hoverboard-icon>
            </hb-icon-button>
          </div>
          <div class="share">
            <hb-icon-button
              class="share-twitter"
              label="${this.shareLabel('Twitter')}"
              share="twitter"
              @click="${this.share}"
            >
              <hoverboard-icon name="twitter"></hoverboard-icon>
            </hb-icon-button>
          </div>
        </div>
      </div>

      ${
        blog
          ? html`<div class="social-group blog">
              <div class="title">
                ${msg(html`Follow our <a href="${blog}" target="${target}" rel="${rel}">Blog</a>`, {
                  id: 'footer.social.follow-blog',
                })}
              </div>
            </div>`
          : nothing
      }

      <div class="social-group social-networks">
        <div class="title">${msg('Follow us', { id: 'footer.social.follow-us' })}</div>
        <ul class="nav-inline">
          ${this.socialNetwork.follow.map(
            (socFollow) => html`
              <li>
                <hb-icon-button label="${socFollow.name}" href="${socFollow.url}" target="_blank">
                  <hoverboard-icon name="${socFollow.name}"></hoverboard-icon>
                </hb-icon-button>
              </li>
            `,
          )}
        </ul>
      </div>

      <div class="social-group email">
        <div class="title">
          <a aria-label="${emailUs}" href="mailto:${this.mailto}">${emailUs}</a>
        </div>
      </div>
    `;
  }

  private shareLabel(network: string) {
    return msg(str`Share on ${network}`, { id: 'footer.social.share' });
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
