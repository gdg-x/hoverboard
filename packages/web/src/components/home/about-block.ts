import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { aboutBlock } from '../../config/site';
import { openVideoDialog } from '../../store/ui';
import { band } from '../../styles/band';
import '../shared/hoverboard-icon';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';

interface Statistic {
  number: string;
  label: string;
  emoji?: string;
}

/** The event in a few words, and its numbers in a bento grid. */
@customElement('about-block')
export class AboutBlock extends ThemedComponent {
  static override styles = [
    band,
    css`
      .layout {
        display: grid;
        gap: var(--hb-space-7);
      }

      .text p {
        max-inline-size: var(--hb-prose-max);
        margin: var(--hb-space-4) 0 0;
      }

      .text .lede {
        font-size: var(--hb-text-lg);
      }

      .actions {
        display: flex;
        flex-wrap: wrap;
        gap: var(--hb-space-3);
        margin-block-start: var(--hb-space-6);
      }

      .stats {
        display: grid;
        grid-template-columns: repeat(2, minmax(0, 1fr));
        grid-auto-rows: minmax(8rem, auto);
        gap: var(--hb-space-4);
      }

      .stat {
        position: relative;
        display: flex;
        flex-direction: column;
        justify-content: flex-end;
        container-type: inline-size;
        padding: var(--hb-space-5);
        border: var(--hb-border-width) solid var(--hb-border-color);
        border-radius: var(--hb-radius-l);
        box-shadow: var(--hb-shadow-card);
      }

      .stat:nth-child(1) {
        grid-row: span 2;
        background-color: var(--hb-color-accent-1-container);
        color: var(--hb-color-on-accent-1-container);
      }

      .stat:nth-child(2) {
        background-color: var(--hb-color-accent-2-container);
        color: var(--hb-color-on-accent-2-container);
      }

      .stat:nth-child(3) {
        background-color: var(--hb-color-accent-3-container);
        color: var(--hb-color-on-accent-3-container);
      }

      .stat:nth-child(4) {
        grid-column: span 2;
        background-color: var(--hb-color-accent-4-container);
        color: var(--hb-color-on-accent-4-container);
      }

      /* The display font is wide, so numbers also scale with their tile. */
      .number {
        font: 800 min(var(--hb-text-5xl), 20cqi) / 1 var(--hb-font-display);
        overflow-wrap: anywhere;
      }

      .stat:nth-child(1) .number {
        font-size: min(var(--hb-text-6xl), 24cqi);
      }

      .label {
        margin-block-start: var(--hb-space-1);
        font-weight: 600;
      }

      .emoji {
        position: absolute;
        inset-block-start: var(--hb-space-4);
        inset-inline-end: var(--hb-space-4);
        font-size: var(--hb-text-3xl);
        line-height: 1;
        rotate: calc(12deg * var(--hb-decorations, 1));
      }

      @container (width >= 800px) {
        .layout {
          grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
          align-items: center;
        }
      }
    `,
  ];

  override render() {
    const { callToAction, statisticsBlock } = aboutBlock;
    const stats: Statistic[] = [
      statisticsBlock.attendees,
      statisticsBlock.days,
      statisticsBlock.sessions,
      statisticsBlock.tracks,
    ];
    return html`
      <div class="inner layout">
        <div class="text">
          <h2 class="band-title">${msg('About', { id: 'home.about-block.title' })}</h2>
          <p class="lede">${callToAction.featuredSessions.description}</p>
          <p>${callToAction.howItWas.description}</p>
          <div class="actions">
            <hb-button
              variant="outlined"
              href="${callToAction.featuredSessions.link}"
              target="_blank"
              trailing-icon
            >
              ${callToAction.featuredSessions.label}
              <hoverboard-icon slot="icon" name="arrow-right-circle"></hoverboard-icon>
            </hb-button>
            <hb-button variant="outlined" class="watch-video" @click="${this.playVideo}">
              <hoverboard-icon slot="icon" name="play"></hoverboard-icon>
              ${callToAction.howItWas.label}
            </hb-button>
          </div>
        </div>

        <ul class="stats plain">
          ${stats.map(
            (stat) => html`
              <li class="stat">
                ${stat.emoji ? html`<span class="emoji" aria-hidden="true">${stat.emoji}</span>` : nothing}
                <span class="number">${stat.number}</span>
                <span class="label">${stat.label}</span>
              </li>
            `,
          )}
        </ul>
      </div>
    `;
  }

  private readonly playVideo = () => {
    openVideoDialog({
      title: aboutBlock.callToAction.howItWas.label,
      youtubeId: aboutBlock.callToAction.howItWas.youtubeId,
    });
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'about-block': AboutBlock;
  }
}
