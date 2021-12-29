import { computed, customElement, property } from '@polymer/decorators';
import { html, PolymerElement } from '@polymer/polymer';
import { Filter } from '../models/filter';
import { FilterGroup, FilterGroupKey } from '../models/filter-group';
import { toggleFilter } from '../utils/filters';
import { generateClassName, getVariableColor, setQueryString } from '../utils/functions';
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
              [[resultsCount]] {$ filters.results $}
            </div>
          </div>

          <div class="actions" layout horizontal center>
            <span
              class="reset-filters"
              role="button"
              on-click="_resetFilters"
              hidden$="[[!selectedFilters.length]]"
            >
              {$ filters.clear $}
            </span>
            <paper-button class="icon-right" on-click="_toggleBoard">
              {$ filters.title $}
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
              on-click="_toggleFilter"
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
                  on-click="_toggleFilter"
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

  @property({ type: Array })
  filterGroups: FilterGroup[] = [];
  @property({ type: Number })
  resultsCount: number = undefined;
  @property({ type: Array })
  selectedFilters: Filter[] = [];
  @property({ type: Boolean })
  opened = false;

  constructor() {
    super();
    this._clickOutsideListener = this._clickOutsideListener.bind(this);
  }

  isSelected(selectedFilters: Filter[], search: Filter) {
    return selectedFilters.some(
      (filter) => filter.tag === search.tag.toLocaleLowerCase() && filter.group === search.group
    );
  }

  _toggleFilter(e: Event) {
    const currentTarget = e.currentTarget as HTMLElement;
    const group = currentTarget.getAttribute('filter-key').trim() as FilterGroupKey;
    const tag = generateClassName(currentTarget.getAttribute('filter-value').trim());
    toggleFilter({ group, tag });
  }

  _toggleBoard() {
    if (this.opened) {
      this._clickOutsideUnlisten();
    } else {
      this._clickOutsideListen();
    }
    this.opened = !this.opened;
  }

  _resetFilters(e: MouseEvent) {
    e.preventDefault();
    setQueryString('');
  }

  @computed('opened')
  get icon() {
    return this.opened ? 'close' : 'filter-list';
  }

  @computed('selectedFilters', 'resultsCount')
  get hideResultText() {
    const { selectedFilters, resultsCount } = this;
    return selectedFilters.length === 0 || typeof resultsCount === 'undefined';
  }

  _clickOutsideListen() {
    this._clickOutsideUnlisten();
    window.addEventListener('click', this._clickOutsideListener, false);
  }

  _clickOutsideUnlisten() {
    window.removeEventListener('click', this._clickOutsideListener, false);
  }

  _clickOutsideListener(e) {
    const isOutside = !e.path.find((path) => path === this);
    if (isOutside) {
      this._toggleBoard();
      this._clickOutsideUnlisten();
    }
  }

  getVariableColor(value: string, fallback: string) {
    return getVariableColor(this, value, fallback);
  }
}
