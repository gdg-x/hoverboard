import { msg } from '@lit/localize';
import { css, html } from 'lit';
import { customElement } from 'lit/decorators.js';
import { illustration, illustrationStyles } from '../../illustrations/illustration';
import noResults from '../../illustrations/no-results.svg?raw';
import { clearFilters } from '../../utils/filters';
import '../ui/hb-button';
import { ThemedComponent } from '../themed-component';

/** Shown when the filters match nothing: a drawing, the slotted message and a way to clear them. */
@customElement('no-results')
export class NoResults extends ThemedComponent {
  static override styles = [
    illustrationStyles,
    css`
      :host {
        display: grid;
        justify-items: start;
        gap: var(--hb-space-3);
        padding-block: var(--hb-space-6);
      }

      p {
        margin: 0;
      }

      .illustration {
        inline-size: min(100%, 12rem);
      }
    `,
  ];

  override render() {
    return html`
      ${illustration(noResults)}
      <p><slot></slot></p>
      <hb-button variant="tonal" @click="${clearFilters}">
        ${msg('Clear filters', { id: 'schedule.day.clear-filters' })}
      </hb-button>
    `;
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'no-results': NoResults;
  }
}
