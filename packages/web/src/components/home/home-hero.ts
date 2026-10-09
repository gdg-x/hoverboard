import { msg, str } from '@lit/localize';
import { css, html, nothing, type TemplateResult } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { unsafeHTML } from 'lit/directives/unsafe-html.js';
import {
  aboutBlock,
  decorations,
  eventDates,
  featuredVideos,
  galleryBlock,
  heroDescriptions,
  heroIllustration,
  heroSettings,
  location,
  timeZone,
  title,
} from '../../config/site';
import { openVideoDialog } from '../../store/ui';
import { getEventDates } from '../../utils/dates';
import { type EventState, daysUntilStart, eventState } from '../../utils/event-state';
import '../shared/hoverboard-icon';
import { navigationLabel } from '../shell/navigation-label';
import { ThemedElement } from '../themed-element';
import '../ui/hb-button';
import '../ui/hb-chip';
import '../ui/hb-sticker';
import { defaultIllustration } from './hero-illustration';

/**
 * The top of the home page: the event state, the event name, dates and place, and the calls to
 * action for the event state. "Buy ticket" fires `show-tickets` for the page to scroll to them.
 */
@customElement('home-hero')
export class HomeHero extends ThemedElement {
  static override styles = css`
    :host {
      display: block;
      container-type: inline-size;
    }

    .hero {
      position: relative;
      isolation: isolate;
      overflow: hidden;
      padding: var(--hb-space-8) var(--hb-gutter) var(--hb-space-9);
      background-color: var(--hb-color-accent-1-container);
      color: var(--hb-color-on-accent-1-container);
    }

    .pattern::before {
      content: '';
      position: absolute;
      z-index: -1;
      inset: 0;
      background-image: radial-gradient(
        color-mix(in srgb, currentColor 14%, transparent) 1.5px,
        transparent 1.6px
      );
      background-size: 22px 22px;
      opacity: var(--hb-decorations, 1);
    }

    /* Light text on the darkened photo: the dark scheme's colors, which the build checks. */
    .photo {
      color-scheme: dark;
      background-color: var(--hb-color-surface);
      color: var(--hb-color-on-surface);
    }

    .photo::before {
      content: '';
      position: absolute;
      z-index: -1;
      inset: 0;
      background-color: var(--hb-color-scrim);
    }

    .background {
      position: absolute;
      z-index: -2;
      inset: 0;
      inline-size: 100%;
      block-size: 100%;
      object-fit: cover;
    }

    .inner {
      display: grid;
      align-items: center;
      gap: var(--hb-space-7);
      max-inline-size: var(--hb-content-max);
      margin-inline: auto;
    }

    .title {
      margin: var(--hb-space-4) 0 var(--hb-space-5);
      padding: 0;
      font: 800 var(--hb-text-6xl) / 0.95 var(--hb-font-display);
      letter-spacing: -0.02em;
      text-wrap: balance;
      overflow-wrap: anywhere;
    }

    .details {
      display: flex;
      flex-wrap: wrap;
      gap: var(--hb-space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .details hb-chip {
      --hb-chip-border-color: currentColor;
    }

    .lede {
      max-inline-size: 32ch;
      margin: var(--hb-space-5) 0 var(--hb-space-6);
      font-size: var(--hb-text-xl);
    }

    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: var(--hb-space-3);
    }

    .art {
      display: none;
    }

    .art svg {
      display: block;
      inline-size: 100%;
      block-size: auto;
    }

    @container (width > 800px) {
      .inner {
        grid-template-columns: 1.4fr 1fr;
      }

      .art {
        display: var(--hb-decorations-display, block);
      }
    }

    @media (forced-colors: active) {
      .pattern::before {
        display: none;
      }
    }
  `;

  /** The event state when the page was built, so the first render matches the server's. */
  @property({ attribute: 'event-state' })
  accessor eventState: EventState = 'upcoming';

  @property({ type: Number, attribute: 'days-to-go' })
  accessor daysToGo = 0;

  // The event may have come closer, started or ended since the build.
  override firstUpdated() {
    const now = new Date();
    const dates = { startDate: eventDates.start, endDate: eventDates.end, timezone: timeZone };
    this.eventState = eventState(now, dates);
    this.daysToGo = daysUntilStart(now, dates);
  }

  override render() {
    const photo = heroSettings?.home?.background?.image;
    return html`
      <section class="hero ${photo ? 'photo' : 'pattern'}" aria-labelledby="hero-title">
        ${photo ? html`<img class="background" src="${photo}" alt="" />` : nothing}
        <div class="inner">
          <div>
            <hb-sticker class="state" tilt="-4" accent="${this.stickerAccent}"
              >${this.stateLabel}</hb-sticker
            >
            <h1 id="hero-title" class="title">${title}</h1>
            <ul class="details" aria-label="${msg('Event details', { id: 'home.hero.details' })}">
              <li>
                <hb-chip>
                  <hoverboard-icon slot="icon" name="calendar"></hoverboard-icon>
                  ${getEventDates()}
                </hb-chip>
              </li>
              <li>
                <hb-chip>
                  <hoverboard-icon slot="icon" name="location"></hoverboard-icon>
                  ${location.short}
                </hb-chip>
              </li>
            </ul>
            <p class="lede">${heroDescriptions.home}</p>
            <div class="actions">${this.renderActions()}</div>
          </div>
          ${
            // The demo banner can turn decorations on, so a demo site always has the drawing.
            decorations || __HB_FEATURES__.demo
              ? html`<div class="art" aria-hidden="true">
                  ${heroIllustration ? unsafeHTML(heroIllustration) : defaultIllustration}
                </div>`
              : nothing
          }
        </div>
      </section>
    `;
  }

  private get stateLabel(): string {
    if (this.eventState === 'live') return msg('Live now', { id: 'home.hero.live' });
    if (this.eventState === 'over') return msg('Thanks for coming!', { id: 'home.hero.over' });
    if (this.daysToGo === 1) return msg('Starts tomorrow', { id: 'home.hero.tomorrow' });
    if (this.daysToGo > 1) {
      return msg(str`${this.daysToGo} days to go`, { id: 'home.hero.days-to-go' });
    }
    return msg('Coming soon', { id: 'home.hero.coming-soon' });
  }

  private get stickerAccent() {
    if (this.eventState === 'live') return '2';
    if (this.eventState === 'over') return '4';
    return '3';
  }

  private renderActions(): TemplateResult[] {
    const highlights = html`
      <hb-button variant="outlined" size="l" class="watch-video" @click="${this.playVideo}">
        <hoverboard-icon slot="icon" name="play"></hoverboard-icon>
        ${msg('View Highlights', { id: 'pages.home.view-highlights' })}
      </hb-button>
    `;

    if (this.eventState === 'over') {
      const recap = [
        __HB_FEATURES__.videos
          ? html`<hb-button
              size="l"
              variant="cta"
              class="videos"
              href="${featuredVideos.callToAction.link}"
              target="_blank"
            >
              <hoverboard-icon slot="icon" name="movie"></hoverboard-icon>
              ${msg('Watch the videos', { id: 'home.hero.videos' })}
            </hb-button>`
          : undefined,
        __HB_FEATURES__.gallery
          ? html`<hb-button
              size="l"
              variant="${__HB_FEATURES__.videos ? 'outlined' : 'cta'}"
              class="photos"
              href="${galleryBlock.callToAction.link}"
              target="_blank"
            >
              <hoverboard-icon slot="icon" name="people"></hoverboard-icon>
              ${msg('See the photos', { id: 'home.hero.photos' })}
            </hb-button>`
          : undefined,
      ].filter((action) => action !== undefined);
      return recap.length > 0 ? recap : [highlights];
    }

    if (this.eventState === 'upcoming' && __HB_FEATURES__.tickets) {
      return [
        html`<hb-button size="l" variant="cta" class="buy-ticket" @click="${this.showTickets}">
          <hoverboard-icon slot="icon" name="ticket"></hoverboard-icon>
          ${msg('Buy ticket', { id: 'common.buy-ticket' })}
        </hb-button>`,
        highlights,
      ];
    }

    if (__HB_FEATURES__.schedule) {
      return [
        html`<hb-button size="l" variant="cta" class="schedule" href="/schedule">
          <hoverboard-icon slot="icon" name="calendar"></hoverboard-icon>
          ${
            this.eventState === 'live'
              ? msg("See what's on now", { id: 'home.hero.live-schedule' })
              : navigationLabel('schedule')
          }
        </hb-button>`,
        highlights,
      ];
    }

    return [highlights];
  }

  private readonly showTickets = () => {
    this.dispatchEvent(new CustomEvent('show-tickets', { bubbles: true, composed: true }));
  };

  private readonly playVideo = () => {
    openVideoDialog({
      title: aboutBlock.callToAction.howItWas.label,
      youtubeId: aboutBlock.callToAction.howItWas.youtubeId,
    });
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'home-hero': HomeHero;
  }
}
