import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { organizer } from '../../config/site';
import { navigationLabel } from '../shell/navigation-label';
import { ThemedElement } from '../themed-element';

const HOVERBOARD_URL = 'https://github.com/gdg-x/hoverboard';

@customElement('footer-nav')
export class FooterNav extends ThemedElement {
  static override styles = css`
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
      /* Note: no "display: flex" here on purpose — the original bare
             "layout" attribute never had a matching "horizontal"/"vertical"
             companion, so legacy CSS never actually made this a flex
             container. Children are positioned with floats below. */
      flex: 1;
      flex-basis: 1px;
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
  `;

  override render() {
    const hoverboard = html`<a href="${HOVERBOARD_URL}" target="_blank" rel="noopener noreferrer"
      >Project Hoverboard</a
    >`;
    return html`
      <div class="nav-inline">
        <a href="${this.organizer.url}" target="_blank" rel="noopener noreferrer">
          <img
            loading="lazy"
            decoding="async"
            class="footer-logo"
            src="../../images/organizer-logo.svg"
            alt="${this.organizer.name}"
          />
        </a>

        <div class="copyright">
          ${msg(html`Based on ${hoverboard}`, { id: 'footer.nav.based-on' })}
          ${
            __HB_FEATURES__.codeOfConduct
              ? html`· <a class="coc" href="/coc">${navigationLabel('codeOfConduct')}</a>`
              : nothing
          }
        </div>
      </div>
    `;
  }

  private organizer = organizer;
}
