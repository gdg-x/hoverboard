import '@polymer/iron-location/iron-location';
import { html, PolymerElement } from '@polymer/polymer';
import { generateClassName, getVariableColor, toggleQueryParam } from '../utils/functions';
import './shared-styles';

class FilterMenu extends PolymerElement {
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

      <iron-location query="{{queryParams}}"></iron-location>

      <div class="filters-toolbar container">
        <div layout horizontal center>
          <div layout horizontal center flex>
            <div class="results" hidden$="[[_hideResultText(resultsCount, _selectedArray)]]">
              [[resultsCount]] {$ filters.results $}
            </div>
          </div>

          <div class="actions" layout horizontal center>
            <span
              class="reset-filters"
              role="button"
              on-click="_resetFilters"
              hidden$="[[!_selectedArray.length]]"
            >
              {$ filters.clear $}
            </span>
            <paper-button class="icon-right" on-click="_toggleBoard">
              {$ filters.title $}
              <iron-icon icon="hoverboard:[[_getFilterIcon(_openedBoard)]]"></iron-icon>
            </paper-button>
          </div>
        </div>

        <div class="selected-filters" hidden$="[[!_selectedArray.length]]">
          <template is="dom-repeat" items="[[_selectedArray]]" as="selectedFilter">
            <div
              class="tag"
              style$="--color: [[getVariableColor(selectedFilter.value, 'primary-text-color')]]"
              filter-key$="[[selectedFilter.key]]"
              filter-value$="[[selectedFilter.value]]"
              on-click="_toggleFilter"
              selected
              layout
              horizontal
              inline
              center
            >
              <span>[[selectedFilter.value]]</span>
              <iron-icon icon="hoverboard:close"></iron-icon>
            </div>
          </template>
        </div>
      </div>

      <div class="filters-board" block$="[[_openedBoard]]">
        <div class="container">
          <template is="dom-repeat" items="[[filters]]" as="filter">
            <div class="filter-group">
              <h3 class="filter-title">[[filter.title]]</h3>
              <template is="dom-repeat" items="[[filter.items]]" as="item">
                <div
                  layout
                  horizontal
                  inline
                  center
                  class="tag"
                  style$="--color: [[getVariableColor(item, 'primary-text-color')]]"
                  filter-key$="[[filter.key]]"
                  filter-value$="[[item]]"
                  selected$="[[_isSelected(selected, filter.key, item)]]"
                  on-click="_toggleFilter"
                >
                  [[item]]
                </div>
              </template>
            </div>
          </template>
        </div>
      </div>
    `;
  }

  static get is() {
    return 'filter-menu';
  }

  private filters = [];
  private resultsCount = 0;
  private selected = {};
  private queryParams: string;
  private _selectedArray = [];
  private _openedBoard = false;

  static get properties() {
    return {
      filters: Array,
      resultsCount: Number,
      queryParams: String,
      selected: {
        type: Object,
        value: {},
      },
      _selectedArray: {
        type: Array,
        computed: '_generateSelectedArray(selected, filters)',
      },
      _openedBoard: {
        type: Boolean,
        value: false,
      },
    };
  }

  constructor() {
    super();
    this._clickOutsideListener = this._clickOutsideListener.bind(this);
  }

  _isSelected(selectedFilters, key, value) {
    return selectedFilters[key] && selectedFilters[key].includes(generateClassName(value.trim()));
  }

  _toggleFilter(e) {
    const filterKey = e.currentTarget.getAttribute('filter-key');
    const filter = generateClassName(e.currentTarget.getAttribute('filter-value').trim());
    this.set('queryParams', toggleQueryParam(this.queryParams, filterKey, filter));
  }

  _generateSelectedArray(selected, filters) {
    if (!selected || !filters) return;
    const targetFilters = filters.map((filter) => filter.key);
    return Object.keys(selected)
      .filter((key) => targetFilters.includes(key))
      .reduce((aggr, key) => aggr.concat(selected[key].map((value) => ({ key, value }))), []);
  }

  _toggleBoard() {
    if (this._openedBoard) {
      this._clickOutsideUnlisten();
    } else {
      this._clickOutsideListen();
    }
    this.set('_openedBoard', !this._openedBoard);
  }

  _resetFilters(e) {
    e.preventDefault();
    this.set('queryParams', '');
  }

  _getFilterIcon(state) {
    return state ? 'close' : 'filter-list';
  }

  _hideResultText(resultsCount, _selectedArray) {
    return !_selectedArray || !_selectedArray.length || typeof resultsCount === 'undefined';
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

customElements.define(FilterMenu.is, FilterMenu);
