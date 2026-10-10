import { msg } from '@lit/localize';
import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, state } from 'lit/decorators.js';
import '../components/attending/online-section';
import '../components/attending/venue-section';
import '../components/hero/simple-hero';
import { ThemedComponent } from '../components/themed-component';
import '../components/ui/hb-chip';
import '../components/shared/hoverboard-icon';
import {
  attendance,
  attendingPage,
  location,
  siteAttendance,
  siteLocation,
  stream,
} from '../config/site';
import { PageMetadataController } from '../controllers/page-metadata-controller';
import { BAND_TONES, bandContent, bandTones } from '../styles/band';
import { getEventDates } from '../utils/dates';
import { type Attending, eventPlace } from '../utils/place';
import { scrollToElement } from '../utils/scrolling';

interface Section {
  id: string;
  title: string;
  render: (heading: TemplateResult) => TemplateResult;
}

/**
 * What attendees need to know to get to the event or join it online, in sections with a table of
 * contents. A section without content is left out of both.
 */
@customElement('attending-page')
export class AttendingPage extends ThemedComponent {
  static override styles = [
    bandContent,
    bandTones,
    css`
      :host {
        display: block;
      }

      .details {
        display: flex;
        flex-wrap: wrap;
        gap: var(--hb-space-2);
        margin: var(--hb-space-5) 0 0;
        padding: 0;
        list-style: none;
      }

      .details hb-chip {
        --hb-chip-border-color: currentColor;
      }

      .toc {
        box-sizing: content-box;
        max-inline-size: var(--hb-content-max);
        margin-inline: auto;
        padding: var(--hb-space-6) var(--hb-gutter) 0;
      }

      .toc h2 {
        margin: 0 0 var(--hb-space-3);
        font: 700 var(--hb-text-md) / 1.3 var(--hb-font-body);
      }

      .toc ul {
        display: flex;
        flex-wrap: wrap;
        gap: var(--hb-space-2) var(--hb-space-5);
        margin: 0;
        padding: 0;
        list-style: none;
      }

      .toc a {
        color: inherit;
        text-underline-offset: 0.2em;
      }

      section.band {
        display: block;
        container-type: inline-size;
        padding: var(--hb-space-9) var(--hb-gutter);
      }
    `,
  ];

  private readonly metadata = new PageMetadataController(this, 'attending');

  // Site.json's on the server and in the first render, so hydration matches. A demo can change it.
  @state()
  private accessor where: Attending = { attendance: siteAttendance, location: siteLocation };

  override async firstUpdated() {
    this.where = { attendance, location };
    // The sections may differ from the server's, so scroll once they render.
    await this.updateComplete;
    this.scrollToHash();
  }

  override connectedCallback() {
    super.connectedCallback();
    window.addEventListener('hashchange', this.scrollToHash);
  }

  override disconnectedCallback() {
    window.removeEventListener('hashchange', this.scrollToHash);
    super.disconnectedCallback();
  }

  // Sections are in the shadow root, where the browser does not look for `#where` and others.
  private readonly scrollToHash = () => {
    const id = window.location.hash.slice(1);
    const element = id ? this.renderRoot.querySelector(`#${CSS.escape(id)}`) : null;
    if (element) scrollToElement(element);
  };

  /** The sections with content, in the page's order. */
  private sections(): Section[] {
    const { attendance: mode, location: venue } = this.where;
    const sections: Section[] = [];
    if (venue) {
      sections.push({
        id: 'where',
        title: msg('Where it is', { id: 'attending.where' }),
        render: (heading) =>
          html`<venue-section .venue=${venue} .photo=${attendingPage?.photo}
            >${heading}</venue-section
          >`,
      });
    }
    if (mode !== 'inPerson' && (stream || attendingPage?.online)) {
      sections.push({
        id: 'online',
        title: msg('Joining online', { id: 'attending.online' }),
        render: (heading) => html`<online-section .attendance=${mode}>${heading}</online-section>`,
      });
    }
    return sections;
  }

  override render() {
    const sections = this.sections();
    return html`
      <simple-hero page="attending">
        <ul class="details" aria-label="${msg('Event details', { id: 'home.hero.details' })}">
          <li>
            <hb-chip>
              <hoverboard-icon slot="icon" name="calendar"></hoverboard-icon>
              ${getEventDates()}
            </hb-chip>
          </li>
          <li>
            <hb-chip>
              <hoverboard-icon
                slot="icon"
                name="${this.where.location ? 'location' : 'monitor'}"
              ></hoverboard-icon>
              ${eventPlace(({ short }) => short, this.where)}
            </hb-chip>
          </li>
        </ul>
      </simple-hero>

      ${
        sections.length > 1
          ? html`<nav class="toc" aria-labelledby="toc-title">
              <h2 id="toc-title">${msg('On this page', { id: 'attending.toc' })}</h2>
              <ul>
                ${sections.map(({ id, title }) => html`<li><a href="#${id}">${title}</a></li>`)}
              </ul>
            </nav>`
          : nothing
      }
      ${sections.map(
        ({ id, title, render }, index) => html`
          <section
            class="band"
            id="${id}"
            data-tone="${BAND_TONES[index % BAND_TONES.length] ?? 'surface'}"
            aria-labelledby="${id}-title"
          >
            <div class="inner">
              ${render(html`<h2 slot="heading" class="band-title" id="${id}-title">${title}</h2>`)}
            </div>
          </section>
        `,
      )}
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'attending-page': AttendingPage;
  }
}
