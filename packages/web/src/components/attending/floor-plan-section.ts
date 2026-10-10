import { msg } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement } from 'lit/decorators.js';
import { attendingPage } from '../../config/site';
import { ThemedComponent } from '../themed-component';
import '../ui/hb-button';
import { contentStyles } from './content';

/** The venue's floor plan, with a link to open it full size. Without one, it renders nothing. */
@customElement('floor-plan-section')
export class FloorPlanSection extends ThemedComponent {
  static override styles = [
    contentStyles,
    css`
      .plan {
        display: block;
        max-inline-size: 100%;
        block-size: auto;
        margin-block-start: var(--hb-space-5);
        border-radius: var(--hb-radius-l);
        background-color: var(--hb-color-surface);
      }

      .open {
        margin-block-start: var(--hb-space-4);
      }
    `,
  ];

  override render() {
    const plan = attendingPage?.floorPlan;
    if (!plan) return nothing;
    return html`
      <slot name="heading"></slot>
      <img class="plan" src="${plan.image}" alt="${plan.alt}" loading="lazy" />
      <hb-button class="open" variant="outlined" href="${plan.image}" target="_blank">
        ${msg('Open full size', { id: 'attending.floor-plan.open' })}
      </hb-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'floor-plan-section': FloorPlanSection;
  }
}
