import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { ifDefined } from 'lit/directives/if-defined.js';
import { build, organizer } from '../../config/site';
import { safeUrl } from '../../utils/safe-url';
import { navigationLabel } from '../shell/navigation-label';
import { ThemedElement } from '../themed-element';

const HOVERBOARD_URL = 'https://github.com/gdg-x/hoverboard';

@customElement('footer-nav')
export class FooterNav extends ThemedElement {
  static override styles = css`
    .nav-inline {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      justify-content: space-between;
      gap: var(--hb-space-4);
    }

    /* Organizer logos are made for white backgrounds, and the footer is dark in both schemes. */
    .footer-logo {
      display: block;
      inline-size: 140px;
      block-size: 48px;
      padding: var(--hb-space-2) var(--hb-space-3);
      border-radius: var(--hb-radius-s);
      background-color: white;
      object-fit: contain;
    }

    .copyright {
      display: flex;
      flex-wrap: wrap;
      gap: var(--hb-space-2);
    }

    a {
      color: inherit;
      text-underline-offset: 0.2em;
    }
  `;

  override render() {
    const hoverboard = html`<a href="${HOVERBOARD_URL}" target="_blank" rel="noopener noreferrer"
      >Project Hoverboard</a
    >`;
    return html`
      <div class="nav-inline">
        <a
          href="${ifDefined(safeUrl(this.organizer.url))}"
          target="_blank"
          rel="noopener noreferrer"
        >
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
          <span class="build"
            >· ${build.sha ? html`${build.sha} · ` : nothing}<time datetime="${build.time}"
              >${build.time.slice(0, 16).replace('T', ' ')} UTC</time
            ></span
          >
        </div>
      </div>
    `;
  }

  private organizer = organizer;
}
