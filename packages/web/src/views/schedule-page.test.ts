import { Pending } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { setStoreState } from '../../__tests__/helpers/store';
import { FilterGroupKey } from '../models/filter-group';
import { store } from '../store';
import { selectFilters } from '../store/filters';
import { selectFilterGroups } from '../store/sessions/selectors';
import { setLocalTime } from '../store/ui';
import { updateMetadata } from '../utils/metadata';
import type { SchedulePage } from './schedule-page';
import './schedule-page';

vi.mock('../utils/metadata');
vi.mock('../store/filters', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/filters')>()),
  selectFilters: vi.fn().mockReturnValue([]),
}));
vi.mock('../store/sessions/selectors', () => ({
  selectFilterGroups: vi.fn().mockReturnValue([]),
}));
vi.mock('../store/ui', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../store/ui')>()),
  setLocalTime: vi.fn(),
}));

const withVisitorTimeZone = (timeZone: string) => {
  const resolvedOptions = Intl.DateTimeFormat.prototype.resolvedOptions;
  vi.spyOn(Intl.DateTimeFormat.prototype, 'resolvedOptions').mockImplementation(function (
    this: Intl.DateTimeFormat,
  ) {
    return { ...resolvedOptions.call(this), timeZone };
  });
};

const render = async (props: Partial<SchedulePage> = {}) => {
  const result = await fixture<SchedulePage>(html`<schedule-page></schedule-page>`);
  Object.assign(result.element, props);
  await result.element.updateComplete;
  return result;
};

describe('schedule-page', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    vi.restoreAllMocks();
  });

  it('sets the page metadata and titles the page', async () => {
    const { shadowRoot } = await render();

    expect(updateMetadata).toHaveBeenCalledWith('Schedule', 'Choose your sessions to visit');
    expect(shadowRoot.querySelector('simple-hero')).toHaveAttribute('page', 'schedule');
  });

  it('shows the progress indicator while the schedule is pending', async () => {
    const { shadowRoot } = await render({ schedule: new Pending() });

    expect(shadowRoot.querySelector('hb-progress')).not.toHaveAttribute('hidden');
  });

  it('passes the location to the day tabs', async () => {
    const location = { pathname: '/schedule/day-1', search: '', params: {} };
    const { shadowRoot } = await render({ location });

    expect(shadowRoot.querySelector('schedule-tabs')!.location).toBe(location);
  });

  it('passes filter groups and selected filters to the filter menu', async () => {
    const filterGroups = [{ key: FilterGroupKey.tags, filters: [] }];
    const selectedFilters = [{ group: FilterGroupKey.tags, tag: 'web' }];
    vi.mocked(selectFilterGroups).mockReturnValue(filterGroups);
    vi.mocked(selectFilters).mockReturnValue(selectedFilters);
    const { shadowRoot } = await render();
    const filterMenu = shadowRoot.querySelector('filter-menu')!;

    expect(filterMenu.filterGroups).toBe(filterGroups);
    expect(filterMenu.selectedFilters).toBe(selectedFilters);
  });

  it('has no filters on My Schedule', async () => {
    const { shadowRoot } = await render({
      location: { pathname: '/schedule/my-schedule', search: '', params: {} },
    });

    expect(shadowRoot.querySelector('filter-menu')).toBeNull();
  });

  it('names the event time zone, with no switch for visitors in it', async () => {
    withVisitorTimeZone('Europe/Kyiv');
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('.zone')).toHaveTextContent('Times in Europe/Kyiv');
    expect(shadowRoot.querySelector('hb-switch')).toBeNull();
  });

  it('offers visitors elsewhere their own time zone, and remembers it', async () => {
    withVisitorTimeZone('America/New_York');
    const { element, shadowRoot } = await render();
    const toggle = shadowRoot.querySelector('hb-switch')!;

    expect(toggle).toHaveTextContent('Show my time zone, America/New York');
    expect(toggle.checked).toBe(false);

    toggle.checked = true;
    toggle.dispatchEvent(new Event('change'));

    expect(setLocalTime).toHaveBeenCalledWith(true);

    setStoreState({ ui: { ...store.getState().ui, localTime: true } });
    await element.updateComplete;

    expect(shadowRoot.querySelector('.zone')).toHaveTextContent('Times in America/New York');
  });
});
