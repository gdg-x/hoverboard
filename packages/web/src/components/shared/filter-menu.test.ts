import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { type FilterGroup, FilterGroupKey } from '../../models/filter-group';
import * as filterUtils from '../../utils/filters';
import type { HbChip } from '../ui/hb-chip';
import type { FilterMenu } from './filter-menu';
import './filter-menu';

vi.mock('../../utils/filters', () => ({
  clearFilters: vi.fn(),
  toggleFilter: vi.fn(),
}));

const filterGroups: FilterGroup[] = [
  {
    key: FilterGroupKey.tags,
    filters: [
      { group: FilterGroupKey.tags, tag: 'Android' },
      { group: FilterGroupKey.tags, tag: 'Web' },
    ],
  },
  {
    key: FilterGroupKey.complexity,
    filters: [{ group: FilterGroupKey.complexity, tag: 'Beginner' }],
  },
];

const render = async (props: Partial<FilterMenu> = {}) => {
  const result = await fixture<FilterMenu>(html`<filter-menu></filter-menu>`);
  Object.assign(result.element, { filterGroups, ...props });
  await result.element.updateComplete;
  return result;
};

describe('filter-menu', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    vi.mocked(filterUtils.toggleFilter).mockClear();
  });

  it('shows the filter chips by group when the Filters button is pressed', async () => {
    const { element, shadowRoot } = await render();
    const button = shadowRoot.querySelector('hb-button')!;
    const panel = shadowRoot.querySelector('.panel')!;

    expect(button.expanded).toBe(false);
    expect(panel).toHaveAttribute('hidden');

    button.click();
    await element.updateComplete;

    expect(button.expanded).toBe(true);
    expect(panel).not.toHaveAttribute('hidden');
    const titles = [...shadowRoot.querySelectorAll('.group-title')].map((title) =>
      title.textContent?.trim(),
    );
    expect(titles).toEqual(['Tags', 'Complexity']);
    const chips = panel.querySelectorAll('hb-chip');
    expect([...chips].map((chip) => chip.textContent?.trim())).toEqual([
      'Android',
      'Web',
      'Beginner',
    ]);
    expect(chips[0]).toHaveAttribute('filter');
  });

  it('leaves out groups without filters', async () => {
    const { shadowRoot } = await render({
      filterGroups: [{ key: FilterGroupKey.complexity, filters: [] }, filterGroups[0]!],
    });

    expect(shadowRoot.querySelectorAll('.group-title')).toHaveLength(1);
  });

  it('colors tag chips with their tag colors', async () => {
    const { shadowRoot } = await render();
    const web = shadowRoot.querySelectorAll<HTMLElement>('.panel hb-chip')[1]!;

    expect(web.style.getPropertyValue('--hb-chip-background')).toBe(
      'var(--hb-tag-web-container, var(--hb-color-surface-container))',
    );
  });

  it('marks selected filters as pressed', async () => {
    const { shadowRoot } = await render({
      selectedFilters: [{ group: FilterGroupKey.tags, tag: 'android' }],
    });
    const chips = shadowRoot.querySelectorAll<HbChip>('.panel hb-chip');

    expect(chips[0]!.selected).toBe(true);
    expect(chips[1]!.selected).toBe(false);
  });

  it('toggles a filter by its lowercase name', async () => {
    const { shadowRoot } = await render();

    shadowRoot.querySelector<HTMLElement>('.panel hb-chip')!.click();

    expect(filterUtils.toggleFilter).toHaveBeenCalledWith({
      group: FilterGroupKey.tags,
      tag: 'android',
    });
  });

  it('lists selected filters as chips that remove them', async () => {
    const { shadowRoot } = await render({
      selectedFilters: [{ group: FilterGroupKey.tags, tag: 'android' }],
    });
    const list = shadowRoot.querySelector('ul.selected')!;

    expect(list).toHaveAttribute('aria-label', 'Selected filters');
    const chip = list.querySelector('hb-chip')!;
    expect(chip).toHaveTextContent('android');
    expect(chip.selected).toBe(true);

    chip.click();

    expect(filterUtils.toggleFilter).toHaveBeenCalledWith({
      group: FilterGroupKey.tags,
      tag: 'android',
    });
  });

  it('names tracks by their titles, in the panel and once selected', async () => {
    const { element, shadowRoot } = await render({
      filterGroups: [
        {
          key: FilterGroupKey.track,
          filters: [{ group: FilterGroupKey.track, tag: 'expo-hall', label: 'Expo hall' }],
        },
      ],
      selectedFilters: [{ group: FilterGroupKey.track, tag: 'expo-hall' }],
    });
    shadowRoot.querySelector('hb-button')!.click();
    await element.updateComplete;

    expect(shadowRoot.querySelector('.group-title')).toHaveTextContent('Tracks');
    expect(shadowRoot.querySelector('.panel hb-chip')).toHaveTextContent('Expo hall');
    expect(shadowRoot.querySelector<HbChip>('.panel hb-chip')!.selected).toBe(true);
    expect(shadowRoot.querySelector('ul.selected hb-chip')).toHaveTextContent('Expo hall');

    shadowRoot.querySelector<HTMLElement>('.panel hb-chip')!.click();

    expect(filterUtils.toggleFilter).toHaveBeenCalledWith({
      group: FilterGroupKey.track,
      tag: 'expo-hall',
    });
  });

  it('clears every filter', async () => {
    const { shadowRoot } = await render({
      selectedFilters: [{ group: FilterGroupKey.tags, tag: 'android' }],
    });

    shadowRoot.querySelector<HTMLElement>('.clear')!.click();

    expect(filterUtils.clearFilters).toHaveBeenCalled();
  });

  it('counts results only while filters are selected', async () => {
    const { element, shadowRoot } = await render({ resultsCount: 3 });

    expect(shadowRoot.querySelector('.results')).toBeNull();

    element.selectedFilters = [{ group: FilterGroupKey.tags, tag: 'android' }];
    await element.updateComplete;

    expect(shadowRoot.querySelector('.results')).toHaveTextContent('3 results');

    element.resultsCount = 1;
    await element.updateComplete;

    expect(shadowRoot.querySelector('.results')).toHaveTextContent('1 result');
  });
});
