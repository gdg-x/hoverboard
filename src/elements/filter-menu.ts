import { computed, customElement, property } from '@polymer/decorators';
import '@polymer/iron-icon';
import '@polymer/paper-button';
import { html, PolymerElement } from '@polymer/polymer';
import { Filter } from '../models/filter';
import { FilterGroup, FilterGroupKey } from '../models/filter-group';
import { filters } from '../utils/data';
import { clearFilters, toggleFilter } from '../utils/filters';
import '../utils/icons';
import { generateClassName, getVariableColor } from '../utils/styles';
import './shared-styles';

@customElement('filter-menu')
export class FilterMenu extends PolymerElement {
  static get template() {
    return html`
      <style include="shared-styles flex flex-alignment positioning">
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

        .tag iron-icon {
          --iron-icon-width: 12px;
          --iron-icon-height: 12px;
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
      </style>

      <div class="filters-toolbar container">
        <div layout horizontal center>
          <div layout horizontal center flex>
            <div class="results" hidden$="[[hideResultText]]">
              [[resultsCount]] [[filters.results]]
            </div>
          </div>

          <div class="actions" layout horizontal center>
            <span
              class="reset-filters"
              role="button"
              on-click="resetFilters"
              hidden$="[[!selectedFilters.length]]"
            >
              [[filters.clear]]
            </span>
            <paper-button class="icon-right" on-click="toggleBoard">
              [[filters.title]]
              <iron-icon icon="hoverboard:[[icon]]"></iron-icon>
            </paper-button>
          </div>
        </div>

        <div class="selected-filters" hidden$="[[!selectedFilters.length]]">
          <template is="dom-repeat" items="[[selectedFilters]]" as="selectedFilter">
            <div
              class="tag"
              style$="--color: [[getVariableColor(selectedFilter.tag, 'primary-text-color')]]"
              filter-key$="[[selectedFilter.group]]"
              filter-value$="[[selectedFilter.tag]]"
              on-click="toggleFilter"
              selected
              layout
              horizontal
              inline
              center
            >
              <span>[[selectedFilter.tag]]</span>
              <iron-icon icon="hoverboard:close"></iron-icon>
            </div>
          </template>
        </div>
      </div>

      <div class="filters-board" block$="[[opened]]">
        <div class="container">
          <template is="dom-repeat" items="[[filterGroups]]" as="filterGroup">
            <div class="filter-group">
              <h3 class="filter-title">[[filterGroup.title]]</h3>
              <template is="dom-repeat" items="[[filterGroup.filters]]" as="filter">
                <div
                  layout
                  horizontal
                  inline
                  center
                  class="tag"
                  style$="--color: [[getVariableColor(filter.tag, 'primary-text-color')]]"
                  filter-key$="[[filterGroup.key]]"
                  filter-value$="[[filter.tag]]"
                  selected$="[[isSelected(selectedFilters, filter)]]"
                  on-click="toggleFilter"
                >
                  [[filter.tag]]
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>
    `;
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

  constructor() {
    super();
    this.clickOutsideListener = this.clickOutsideListener.bind(this);
  }

  private isSelected(selectedFilters: Filter[], search: Filter) {
    return selectedFilters.some(
      (filter) => filter.tag === search.tag.toLocaleLowerCase() && filter.group === search.group
    );
  }

  private toggleFilter(e: PointerEvent) {
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
      this.clickOutsideUnlisten();
    } else {
      this.clickOutsideListen();
    }
    this.opened = !this.opened;
  }

  private resetFilters(e: MouseEvent) {
    e.preventDefault();
    clearFilters();
  }

  @computed('opened')
  private get icon() {
    return this.opened ? 'close' : 'filter-list';
  }

  @computed('selectedFilters', 'resultsCount')
  private get hideResultText() {
    const { selectedFilters, resultsCount } = this;
    return selectedFilters.length === 0 || typeof resultsCount === 'undefined';
  }

  private clickOutsideListen() {
    this.clickOutsideUnlisten();
    window.addEventListener('click', this.clickOutsideListener, false);
  }

  private clickOutsideUnlisten() {
    window.removeEventListener('click', this.clickOutsideListener, false);
  }

  private clickOutsideListener(e: MouseEvent) {
    const isOutside = !e.composedPath().find((path) => path === this);
    if (isOutside) {
      this.toggleBoard();
      this.clickOutsideUnlisten();
    }
  }

  private getVariableColor(value: string, fallback: string) {
    return getVariableColor(this, value, fallback);
  }
}
