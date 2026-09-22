import { Initialized, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { FilterGroupKey } from '../models/filter-group';
import { fetchSchedule } from '../store/schedule/actions';
import { selectFilters } from '../store/filters/selectors';
import { fetchSessions } from '../store/sessions/actions';
import { selectFilterGroups } from '../store/sessions/selectors';
import { fetchSpeakers } from '../store/speakers/actions';
import { heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './schedule-page';
import { SchedulePage } from './schedule-page';

jest.mock('../utils/metadata');
jest.mock('@polymer/app-layout/app-toolbar/app-toolbar', () => ({}));
jest.mock('@polymer/paper-tabs', () => ({}));
jest.mock('../utils/scrolling', () => ({
  scrollToTop: jest.fn(),
}));
jest.mock('../store/schedule/actions', () => ({
  fetchSchedule: jest.fn(),
}));
jest.mock('../store/sessions/actions', () => ({
  fetchSessions: jest.fn(),
}));
jest.mock('../store/speakers/actions', () => ({
  fetchSpeakers: jest.fn(),
}));
jest.mock('../store/filters/selectors', () => ({
  selectFilters: jest.fn().mockReturnValue([]),
}));
jest.mock('../store/sessions/selectors', () => ({
  selectFilterGroups: jest.fn().mockReturnValue([]),
}));

describe('schedule-page', () => {
  it('defines a component', () => {
    expect(customElements.get('schedule-page')).toBeDefined();
  });

  it('updates metadata and dispatches fetch thunks on connect', async () => {
    const mockUpdateMetadata = jest.mocked(updateMetadata);
    const mockFetchSessions = fetchSessions as jest.MockedFunction<typeof fetchSessions>;
    const mockFetchSpeakers = fetchSpeakers as jest.MockedFunction<typeof fetchSpeakers>;
    mockUpdateMetadata.mockClear();
    mockFetchSessions.mockClear();
    mockFetchSpeakers.mockClear();

    await fixture<SchedulePage>(html`<schedule-page></schedule-page>`);

    expect(mockUpdateMetadata).toHaveBeenCalledWith(
      heroSettings.schedule.title,
      heroSettings.schedule.metaDescription,
    );
    expect(mockFetchSessions).toHaveBeenCalled();
    expect(mockFetchSpeakers).toHaveBeenCalled();
  });

  it('dispatches fetchSchedule once sessions and speakers succeed', async () => {
    const mockFetchSchedule = fetchSchedule as jest.MockedFunction<typeof fetchSchedule>;
    mockFetchSchedule.mockClear();

    const { element } = await fixture<SchedulePage>(html`<schedule-page></schedule-page>`);
    element.schedule = new Initialized();
    element.sessions = new Success([]);
    element.speakers = new Success([]);
    await element.updateComplete;

    expect(mockFetchSchedule).toHaveBeenCalled();
  });

  it('shows the progress indicator while schedule is pending', async () => {
    const { element, shadowRoot } = await fixture<SchedulePage>(
      html`<schedule-page></schedule-page>`,
    );
    element.schedule = new Pending();
    await element.updateComplete;

    expect(shadowRoot.querySelector('md-linear-progress')).not.toHaveAttribute('hidden');
  });

  it('passes the router location to header-bottom-toolbar', async () => {
    const { element, shadowRoot } = await fixture<SchedulePage>(
      html`<schedule-page></schedule-page>`,
    );
    element.onAfterEnter({ pathname: '/schedule/day-1' } as never);
    await element.updateComplete;

    const toolbar = shadowRoot.querySelector('header-bottom-toolbar') as never as {
      location: { pathname: string };
    };
    expect(toolbar.location.pathname).toBe('/schedule/day-1');
  });

  it('forwards filter groups and selected filters to filter-menu', async () => {
    const mockSelectFilterGroups = selectFilterGroups as jest.MockedFunction<
      typeof selectFilterGroups
    >;
    const mockSelectFilters = selectFilters as jest.MockedFunction<typeof selectFilters>;
    const filterGroups = [{ title: 'Tags', key: FilterGroupKey.tags, filters: [] }];
    const selectedFilters = [{ group: FilterGroupKey.tags, tag: 'web' }];
    mockSelectFilterGroups.mockReturnValue(filterGroups);
    mockSelectFilters.mockReturnValue(selectedFilters);

    const { element, shadowRoot } = await fixture<SchedulePage>(
      html`<schedule-page></schedule-page>`,
    );
    element.stateChanged({} as never);
    await element.updateComplete;

    const filterMenu = shadowRoot.querySelector('filter-menu') as never as {
      filterGroups: unknown;
      selectedFilters: unknown;
    };
    expect(filterMenu.filterGroups).toBe(filterGroups);
    expect(filterMenu.selectedFilters).toBe(selectedFilters);
  });
});
