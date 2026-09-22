import { describe, expect, it, jest } from '@jest/globals';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { FilterGroup, FilterGroupKey } from '../models/filter-group';
import { filters as filtersText } from '../utils/data';
import * as filterUtils from '../utils/filters';
import type { FilterMenu } from './filter-menu';
import './filter-menu';

jest.mock('../utils/filters', () => ({
  clearFilters: jest.fn(),
  toggleFilter: jest.fn(),
}));

const filterGroups: FilterGroup[] = [
  {
    title: 'Tags',
    key: FilterGroupKey.tags,
    filters: [
      { group: FilterGroupKey.tags, tag: 'Android' },
      { group: FilterGroupKey.tags, tag: 'Web' },
    ],
  },
];

describe('filter-menu', () => {
  it('defines a component', () => {
    expect(customElements.get('filter-menu')).toBeDefined();
  });

  it('renders a tag for every filter in every group', async () => {
    const { element, shadowRoot } = await fixture<FilterMenu>(html`<filter-menu></filter-menu>`);
    element.filterGroups = filterGroups;
    await element.updateComplete;

    expect(shadowRoot.querySelector('.filter-title')).toHaveTextContent('Tags');
    const tags = shadowRoot.querySelectorAll('.filters-board .tag');
    expect(tags).toHaveLength(2);
    expect(tags[0]).toHaveTextContent('Android');
    expect(tags[0]).toHaveAttribute('filter-key', 'tags');
    expect(tags[0]).toHaveAttribute('filter-value', 'Android');
  });

  it('marks selected filters in the board', async () => {
    const { element, shadowRoot } = await fixture<FilterMenu>(html`<filter-menu></filter-menu>`);
    element.filterGroups = filterGroups;
    element.selectedFilters = [{ group: FilterGroupKey.tags, tag: 'android' }];
    await element.updateComplete;

    const tags = shadowRoot.querySelectorAll('.filters-board .tag');
    expect(tags[0]).toHaveAttribute('selected');
    expect(tags[1]).not.toHaveAttribute('selected');
  });

  it('renders selected filters as removable chips', async () => {
    const { element, shadowRoot } = await fixture<FilterMenu>(html`<filter-menu></filter-menu>`);
    element.selectedFilters = [{ group: FilterGroupKey.tags, tag: 'android' }];
    await element.updateComplete;

    const selected = shadowRoot.querySelector('.selected-filters');
    expect(selected).not.toHaveAttribute('hidden');
    expect(selected?.querySelector('.tag')).toHaveTextContent('android');
    expect(selected?.querySelector('hoverboard-icon')).toHaveAttribute('name', 'close');
  });

  it('hides the result count until filters are selected', async () => {
    const { element, shadowRoot } = await fixture<FilterMenu>(html`<filter-menu></filter-menu>`);
    expect(shadowRoot.querySelector('.results')).toHaveAttribute('hidden');

    element.selectedFilters = [{ group: FilterGroupKey.tags, tag: 'android' }];
    element.resultsCount = 3;
    await element.updateComplete;

    const results = shadowRoot.querySelector('.results');
    expect(results).not.toHaveAttribute('hidden');
    expect(results).toHaveTextContent(`3 ${filtersText.results}`);
  });

  it('toggles the board and the icon when the toggle button is clicked', async () => {
    const { element, shadowRoot } = await fixture<FilterMenu>(html`<filter-menu></filter-menu>`);
    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute('name', 'filter-list');

    shadowRoot.querySelector<HTMLElement>('md-outlined-button')!.click();
    await element.updateComplete;

    expect(element.opened).toBe(true);
    expect(shadowRoot.querySelector('.filters-board')).toHaveAttribute('block');
    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute('name', 'close');
  });

  it('toggles a filter when a tag is clicked', async () => {
    const { element, shadowRoot } = await fixture<FilterMenu>(html`<filter-menu></filter-menu>`);
    element.filterGroups = filterGroups;
    await element.updateComplete;

    shadowRoot.querySelector<HTMLElement>('.filters-board .tag')!.click();

    expect(filterUtils.toggleFilter).toHaveBeenCalledWith({
      group: FilterGroupKey.tags,
      tag: 'android',
    });
  });

  it('clears filters when reset is clicked', async () => {
    const { element, shadowRoot } = await fixture<FilterMenu>(html`<filter-menu></filter-menu>`);
    element.selectedFilters = [{ group: FilterGroupKey.tags, tag: 'android' }];
    await element.updateComplete;

    shadowRoot.querySelector<HTMLElement>('.reset-filters')!.click();

    expect(filterUtils.clearFilters).toHaveBeenCalled();
  });
});
