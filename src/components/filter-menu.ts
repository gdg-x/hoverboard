import '@material/web/button/outlined-button.js';
import { css, html } from 'lit';
import { customElement, property } from 'lit/decorators.js';
import { repeat } from 'lit/directives/repeat.js';
import { styleMap } from 'lit/directives/style-map.js';
import { ClickOutsideController } from '../controllers/click-outside-controller';
import { Filter } from '../models/filter';
import { FilterGroup, FilterGroupKey } from '../models/filter-group';
import { filters } from '../utils/data';
import { clearFilters, toggleFilter } from '../utils/filters';
import { generateClassName, getVariableColor } from '../utils/styles';
import './hoverboard-icon';
import { ThemedElement } from './themed-element';

@customElement('filter-menu')
export class FilterMenu extends ThemedElement {
  static override get styles() {
    return [
      ...super.styles,
      css`
        :host {
          display: block;
          width: 100%;
          border-bottom: 1px solid var(--divider-color);
          position: relative;
        }

        .filters-board {
          position: absolute;
          right: 0;
          bottom: 0;
          left: 0;
          z-index: 2;
          background-color: var(--primary-background-color);
          box-shadow: var(--box-shadow);
          transform: translateY(100%);
          display: none;
        }

        .filters-toolbar {
          padding: 16px;
        }

        .filter-group {
          margin-bottom: 24px;
        }

        .filter-title {
          margin-bottom: 8px;
        }

        .tag {
          margin-right: 8px;
          margin-bottom: 8px;
          display: inline-flex;
          font-size: 15px;
          cursor: pointer;
          color: var(--color);
          text-transform: capitalize;
        }

        .tag hoverboard-icon {
          width: 12px;
          height: 12px;
        }

        [selected] {
          background-color: var(--color);
          border-color: var(--color);
          color: white;
        }

        .selected-filters {
          margin-bottom: 8px;
        }

        .reset-filters {
          margin-right: 8px;
          font-size: 14px;
          cursor: pointer;
          color: var(--default-primary-color);
        }

        @media (min-width: 640px) {
          .filters-toolbar {
            padding: 16px 32px;
          }
        }
      `,
    ];
  }

  private filters = filters;

  @property({ type: Array })
  filterGroups: FilterGroup[] = [];
  @property({ type: Number })
  resultsCount: number | undefined;
  @property({ type: Array })
  selectedFilters: Filter[] = [];
  @property({ type: Boolean })
  opened = false;

  private readonly clickOutsideController = new ClickOutsideController(this, () =>
    this.toggleBoard(),
  );

  override render() {
    return html`
      <div class="filters-toolbar container">
        <div layout horizontal center>
          <div layout horizontal center flex>
            <div class="results" ?hidden="${this.hideResultText}">
              ${this.resultsCount} ${this.filters.results}
            </div>
          </div>

          <div class="actions" layout horizontal center>
            <span
              class="reset-filters"
              role="button"
              @click="${this.resetFilters}"
              ?hidden="${!this.selectedFilters.length}"
            >
              ${this.filters.clear}
            </span>
            <md-outlined-button class="icon-right" trailing-icon @click="${this.toggleBoard}">
              ${this.filters.title}
              <hoverboard-icon slot="icon" name="${this.icon}"></hoverboard-icon>
            </md-outlined-button>
          </div>
        </div>

        <div class="selected-filters" ?hidden="${!this.selectedFilters.length}">
          ${repeat(
            this.selectedFilters,
            (selectedFilter) => `${selectedFilter.group}:${selectedFilter.tag}`,
            (selectedFilter) => html`
              <div
                class="tag"
                style="${styleMap({ '--color': this.getVariableColor(selectedFilter.tag, 'primary-text-color') })}"
                filter-key="${selectedFilter.group}"
                filter-value="${selectedFilter.tag}"
                @click="${this.toggleFilter}"
                selected
                layout
                horizontal
                inline
                center
              >
                <span>${selectedFilter.tag}</span>
                <hoverboard-icon name="close"></hoverboard-icon>
              </div>
            `,
          )}
        </div>
      </div>

      <div class="filters-board" ?block="${this.opened}">
        <div class="container">
          ${this.filterGroups.map(
            (filterGroup) => html`
              <div class="filter-group">
                <h3 class="filter-title">${filterGroup.title}</h3>
                ${repeat(
                  filterGroup.filters,
                  (filter) => `${filterGroup.key}:${filter.tag}`,
                  (filter) => html`
                    <div
                      layout
                      horizontal
                      inline
                      center
                      class="tag"
                      style="${styleMap({ '--color': this.getVariableColor(filter.tag, 'primary-text-color') })}"
                      filter-key="${filterGroup.key}"
                      filter-value="${filter.tag}"
                      ?selected="${this.isSelected(this.selectedFilters, filter)}"
                      @click="${this.toggleFilter}"
                    >
                      ${filter.tag}
                    </div>
                  `,
                )}
              </div>
            `,
          )}
        </div>
      </div>
    `;
  }

  private isSelected(selectedFilters: Filter[], search: Filter) {
    return selectedFilters.some(
      (filter) => filter.tag === search.tag.toLocaleLowerCase() && filter.group === search.group,
    );
  }

  private toggleFilter(e: Event) {
    if (
      !(e.currentTarget instanceof HTMLElement) ||
      !e.currentTarget.getAttribute('filter-key') ||
      !e.currentTarget.getAttribute('filter-value')
    ) {
      console.error('Toggle filter invalid or missing attributes.');
      return;
    }

    const currentTarget = e.currentTarget;
    const group = currentTarget.getAttribute('filter-key')?.trim() as FilterGroupKey;
    const tag = generateClassName(currentTarget.getAttribute('filter-value')?.trim());
    toggleFilter({ group, tag });
  }

  private toggleBoard() {
    if (this.opened) {
      this.clickOutsideController.stop();
    } else {
      this.clickOutsideController.start();
    }
    this.opened = !this.opened;
  }

  private resetFilters(e: MouseEvent) {
    e.preventDefault();
    clearFilters();
  }

  private get icon() {
    return this.opened ? 'close' : 'filter-list';
  }

  private get hideResultText() {
    const { selectedFilters, resultsCount } = this;
    return selectedFilters.length === 0 || typeof resultsCount === 'undefined';
  }

  private getVariableColor(value: string, fallback: string) {
    return String(getVariableColor(this, value, fallback));
  }
}

declare global {
  interface HTMLElementTagNameMap {
    'filter-menu': FilterMenu;
  }
}
