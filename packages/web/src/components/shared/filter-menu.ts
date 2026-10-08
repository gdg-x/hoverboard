import { msg, str } from '@lit/localize';
import { css, html, nothing } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import type { Filter } from '../../models/filter';
import { type FilterGroup, FilterGroupKey } from '../../models/filter-group';
import { clearFilters, toggleFilter } from '../../utils/filters';
import { getLocale } from '../../utils/localization';
import { generateClassName, tagChipStyle } from '../../utils/styles';
import './hoverboard-icon';
import '../ui/hb-button';
import '../ui/hb-chip';
import { ThemedElement } from '../themed-element';

/**
 * A Filters button that shows the tag and complexity chips under it, and the selected filters as
 * chips that remove themselves. Filters live in the URL, so they survive reloads and links.
 */
@customElement('filter-menu')
export class FilterMenu extends ThemedElement {
  static override styles = css`
    :host {
      display: block;
    }

    .bar {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--hb-space-2) var(--hb-space-3);
    }

    ul {
      display: flex;
      flex-wrap: wrap;
      gap: var(--hb-space-2);
      margin: 0;
      padding: 0;
      list-style: none;
    }

    .clear {
      min-block-size: var(--hb-target-min);
      padding: 0 var(--hb-space-2);
      border: 0;
      background: none;
      color: inherit;
      font: inherit;
      font-weight: 600;
      text-decoration: underline;
      text-underline-offset: 0.2em;
      cursor: pointer;
    }

    .clear:focus-visible {
      outline: 3px solid var(--hb-color-focus);
      outline-offset: 2px;
      border-radius: var(--hb-radius-s);
    }

    .results {
      color: var(--hb-color-on-surface-variant);
      font-size: var(--hb-text-sm);
    }

    .panel {
      display: grid;
      gap: var(--hb-space-5);
      margin-block-start: var(--hb-space-3);
      padding: var(--hb-space-5);
      border: var(--hb-border-width) solid var(--hb-border-color);
      border-radius: var(--hb-radius-l);
      background-color: var(--hb-color-surface-bright);
      color: var(--hb-color-on-surface);
      box-shadow: var(--hb-shadow-card);
    }

    .panel[hidden] {
      display: none;
    }

    .group-title {
      margin: 0 0 var(--hb-space-3);
      padding: 0;
      font: 700 var(--hb-text-md) / 1.3 var(--hb-font-body);
    }

    hb-chip {
      text-transform: capitalize;
    }
  `;

  @property({ attribute: false })
  accessor filterGroups: FilterGroup[] = [];
  @property({ type: Number })
  accessor resultsCount: number | undefined;
  @property({ attribute: false })
  accessor selectedFilters: Filter[] = [];
  @property({ type: Boolean })
  accessor opened = false;

  private groupTitle(key: FilterGroupKey) {
    return key === FilterGroupKey.tags
      ? msg('Tags', { id: 'shared.filter-menu.tags' })
      : msg('Complexity', { id: 'shared.filter-menu.complexity' });
  }

  private resultsLabel(count: number) {
    return new Intl.PluralRules(getLocale()).select(count) === 'one'
      ? msg(str`${count} result`, { id: 'shared.filter-menu.results.one' })
      : msg(str`${count} results`, { id: 'shared.filter-menu.results.other' });
  }

  override render() {
    const selected = this.selectedFilters;
    return html`
      <div class="bar">
        <hb-button
          variant="outlined"
          trailing-icon
          .expanded="${this.opened}"
          @click="${this.toggleBoard}"
        >
          ${msg('Filters', { id: 'shared.filter-menu.title' })}
          <hoverboard-icon slot="icon" name="${this.opened ? 'close' : 'filter-list'}">
          </hoverboard-icon>
        </hb-button>
        ${
          selected.length
            ? html`
                <ul
                  class="selected"
                  aria-label="${msg('Selected filters', { id: 'shared.filter-menu.selected' })}"
                >
                  ${repeat(
                    selected,
                    (filter) => `${filter.group}:${filter.tag}`,
                    (filter) => html`
                      <li>
                        <hb-chip filter selected @click="${() => this.toggle(filter)}">
                          ${filter.tag}
                        </hb-chip>
                      </li>
                    `,
                  )}
                </ul>
                <button type="button" class="clear" @click="${clearFilters}">
                  ${msg('Clear all', { id: 'shared.filter-menu.clear' })}
                </button>
                ${
                  this.resultsCount === undefined
                    ? nothing
                    : html`<span class="results" role="status">
                        ${this.resultsLabel(this.resultsCount)}
                      </span>`
                }
              `
            : nothing
        }
      </div>

      <div class="panel" ?hidden="${!this.opened}">
        ${this.filterGroups
          .filter((group) => group.filters.length)
          .map(
            (group) => html`
              <div>
                <h3 class="group-title" id="group-${group.key}">${this.groupTitle(group.key)}</h3>
                <ul aria-labelledby="group-${group.key}">
                  ${repeat(
                    group.filters,
                    (filter) => `${group.key}:${filter.tag}`,
                    (filter) => html`
                      <li>
                        <hb-chip
                          filter
                          .selected="${this.isSelected(filter)}"
                          style="${styleMap(group.key === FilterGroupKey.tags ? tagChipStyle(filter.tag) : {})}"
                          @click="${() => this.toggle(filter)}"
                        >
                          ${filter.tag}
                        </hb-chip>
                      </li>
                    `,
                  )}
                </ul>
              </div>
            `,
          )}
      </div>
    `;
  }

  private isSelected(search: Filter) {
    return this.selectedFilters.some(
      (filter) => filter.group === search.group && filter.tag === generateClassName(search.tag),
    );
  }

  private toggle(filter: Filter) {
    toggleFilter({ group: filter.group, tag: generateClassName(filter.tag) });
  }

  private readonly toggleBoard = () => {
    this.opened = !this.opened;
  };
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-menu': FilterMenu;
  }
}
