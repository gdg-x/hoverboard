import { Success } from '@abraham/remotedata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import { store } from '../../store';
import { FilterGroupKey } from '../../models/filter-group';
import type { BuiltDay, BuiltSession } from '../../schedule/build-schedule';
import { wallClock, zonedTime } from '../../utils/time-zone';
import type { SessionElement } from '../../components/schedule/session-element';
import {
  matchesFilters,
  narrowGridArea,
  type ScheduleDay,
  trackColumns,
  withTimeColumn,
} from './schedule-day';
import './schedule-day';

const session = (id: string, title: string, tags: string[]) =>
  ({ id, title, description: '', tags, mainTag: tags[0]!, speakers: [] }) as BuiltSession;
const web = session('web', 'Web talk', ['Web']);
const android = session('android', 'Android talk', ['Android']);

// The demo site's time zone is Europe/Kyiv, UTC+2 in January.
const day: BuiltDay = {
  date: '2024-01-01',
  tracks: [
    { id: 'main', title: 'Main hall' },
    { id: 'room-2', title: 'Room 2' },
  ],
  timeslots: [
    {
      startTime: '10:00',
      endTime: '11:00',
      sessions: [
        { items: [web], gridArea: '1 / 1 / 1 / 2' },
        { items: [android], gridArea: '1 / 2 / 1 / 3' },
      ],
    },
    {
      startTime: '11:00',
      endTime: '12:00',
      sessions: [{ items: [], gridArea: '2 / 1 / 2 / 3' }],
    },
  ],
  tags: ['Web', 'Android'],
};

const render = async (props: Partial<ScheduleDay> = {}) => {
  const result = await fixture<ScheduleDay>(html`<schedule-day></schedule-day>`);
  Object.assign(result.element, { day, ...props });
  await result.element.updateComplete;
  return { ...result, view: within(result.shadowRootForWithin) };
};

describe('schedule-day', () => {
  beforeEach(() => {
    Element.prototype.scrollIntoView = vi.fn();
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('labels the day as a region with its times and sessions', async () => {
    const { shadowRoot, view } = await render();

    expect(view.getByRole('region', { name: 'Schedule for January 1' })).toBeInTheDocument();
    const times = [...shadowRoot.querySelectorAll('.time')];
    expect(times.map((time) => time.textContent?.trim())).toEqual(['10:00', '11:00']);
    expect(times[0]!.querySelector('time')).toHaveAttribute(
      'datetime',
      zonedTime('2024-01-01', '10:00', 'Europe/Kyiv').toISOString(),
    );
    const sessions = [...shadowRoot.querySelectorAll<SessionElement>('session-element')];
    expect(sessions.map((session) => session.session?.id)).toEqual(['web', 'android']);
  });

  it('puts sessions in the track columns after the time column', async () => {
    const { shadowRoot } = await render();
    const blocks = shadowRoot.querySelectorAll<HTMLElement>('.block');

    expect(blocks[1]!.style.gridArea).toBe('1 / 3 / 1 / 4');
  });

  it('names the tracks', async () => {
    const { shadowRoot } = await render();

    expect([...shadowRoot.querySelectorAll('.track')].map((track) => track.textContent)).toEqual([
      'Main hall',
      'Room 2',
    ]);
  });

  it("shows times in the visitor's time zone when they chose so", async () => {
    setStoreState({ ui: { ...store.getState().ui, localTime: true } });
    const { shadowRoot } = await render();
    const local = wallClock(zonedTime('2024-01-01', '10:00', 'Europe/Kyiv'));

    expect(shadowRoot.querySelector('.time')).toHaveTextContent(local.time);
  });

  it('shows only sessions that match the filters', async () => {
    setStoreState({ filters: new Success([{ group: FilterGroupKey.tags, tag: 'web' }]) });
    const { shadowRoot } = await render();

    const sessions = [...shadowRoot.querySelectorAll<SessionElement>('session-element')];
    expect(sessions.map((session) => session.session?.id)).toEqual(['web']);
  });

  it('shows only the columns of the tracks picked in the filters', async () => {
    setStoreState({ filters: new Success([{ group: FilterGroupKey.track, tag: 'room-2' }]) });
    const { shadowRoot } = await render();

    expect([...shadowRoot.querySelectorAll('.track')].map((track) => track.textContent)).toEqual([
      'Room 2',
    ]);
    const sessions = [...shadowRoot.querySelectorAll<SessionElement>('session-element')];
    expect(sessions.map((session) => session.session?.id)).toEqual(['android']);
    expect(shadowRoot.querySelector<HTMLElement>('.block')!.style.gridArea).toBe('1 / 2 / 1 / 3');
    expect(shadowRoot.querySelector<HTMLElement>('.grid')!.style.getPropertyValue('--tracks')).toBe(
      '1',
    );
  });

  it('offers to clear filters that match nothing', async () => {
    setStoreState({ filters: new Success([{ group: FilterGroupKey.tags, tag: 'design' }]) });
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('.empty')).toHaveTextContent(
      'No sessions match these filters.',
    );
    expect(shadowRoot.querySelector('.empty .illustration svg')).toBeInTheDocument();
    expect(shadowRoot.querySelector('.empty hb-button')).toHaveTextContent('Clear filters');
  });

  it('links empty timeslots in My Schedule to the day', async () => {
    const { view } = await render({ onlyFeatured: true });
    const link = view.getByRole('link', { name: 'Browse sessions' });

    expect(link).toHaveAttribute('href', '/schedule/2024-01-01#11:00');
    expect(view.getAllByRole('link', { name: 'Browse sessions' })).toHaveLength(1);
  });

  it('shows no time and no link for a row where no session starts, such as a break', async () => {
    const withBreak: BuiltDay = {
      ...day,
      timeslots: [
        ...day.timeslots,
        { startTime: '12:00', endTime: '12:30', sessions: [] },
        {
          startTime: '12:30',
          endTime: '13:00',
          sessions: [{ items: [], gridArea: '4 / 1 / 5 / 3' }],
        },
      ],
    };
    const { shadowRoot, view } = await render({ day: withBreak, onlyFeatured: true });

    const times = [...shadowRoot.querySelectorAll('.time')];
    expect(times.map((time) => time.textContent?.trim())).toEqual(['10:00', '11:00', '12:30']);
    expect(
      view
        .getAllByRole('link', { name: 'Browse sessions' })
        .map((link) => link.getAttribute('href')),
    ).toEqual(['/schedule/2024-01-01#11:00', '/schedule/2024-01-01#12:30']);
  });

  it('marks the current time during the day, after the first render', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    // 10:30 in Kyiv.
    vi.setSystemTime(new Date('2024-01-01T08:30:00Z'));
    const { shadowRoot, element } = await render();
    await element.updateComplete;

    const now = shadowRoot.querySelector<HTMLElement>('.now')!;
    expect(now.style.gridRow).toBe('1');
    expect(now.querySelector<HTMLElement>('.now-line')!.style.insetBlockStart).toBe('50%');
    expect(now).toHaveTextContent('Now · 10:30');
    expect(Element.prototype.scrollIntoView).toHaveBeenCalled();
  });

  it('has no current time line on other days', async () => {
    vi.useFakeTimers({ toFake: ['Date'] });
    vi.setSystemTime(new Date('2024-01-02T08:30:00Z'));
    const { shadowRoot, element } = await render();
    await element.updateComplete;

    expect(shadowRoot.querySelector('.now')).toBeNull();
  });

  it("finds the location's day in the schedule", async () => {
    const other = { ...day, date: '2024-01-02' };
    const { element, view } = await render({
      day: undefined,
      schedule: new Success([day, other]),
      location: { pathname: '/schedule/2024-01-02', search: '', params: { id: '2024-01-02' } },
    });

    expect(element.day).toBe(other);
    expect(view.getByRole('region', { name: 'Schedule for January 2' })).toBeInTheDocument();
  });
});

describe('withTimeColumn', () => {
  it('moves a grid area one column over', () => {
    expect(withTimeColumn('2 / 1 / 4 / 4')).toBe('2 / 2 / 4 / 5');
  });

  it('ignores a missing or malformed area', () => {
    expect(withTimeColumn(undefined)).toBeUndefined();
    expect(withTimeColumn('1 / 2')).toBeUndefined();
  });
});

describe('trackColumns', () => {
  const tracks = [
    { id: 'main', title: 'Main hall' },
    { id: 'room-2', title: 'Room 2' },
    { id: 'room-3', title: 'Room 3' },
  ];

  it('shows every column without a track filter', () => {
    expect(trackColumns(tracks, [{ group: FilterGroupKey.tags, tag: 'web' }])).toEqual([1, 2, 3]);
  });

  it('shows the columns of any of the picked tracks', () => {
    expect(
      trackColumns(tracks, [
        { group: FilterGroupKey.track, tag: 'main' },
        { group: FilterGroupKey.track, tag: 'room-3' },
      ]),
    ).toEqual([1, 3]);
  });

  it('shows no column when the picked tracks are not on the day', () => {
    expect(trackColumns(tracks, [{ group: FilterGroupKey.track, tag: 'expo' }])).toEqual([]);
  });

  it('keeps the one column of a day without tracks', () => {
    expect(trackColumns([], [{ group: FilterGroupKey.track, tag: 'main' }])).toEqual([1]);
  });
});

describe('narrowGridArea', () => {
  it('moves a block to its column among the ones shown', () => {
    expect(narrowGridArea('2 / 3 / 4 / 4', [1, 3])).toBe('2 / 2 / 4 / 3');
  });

  it('narrows a session that spans every track to the tracks shown', () => {
    expect(narrowGridArea('2 / 1 / 3 / 4', [1, 3])).toBe('2 / 1 / 3 / 3');
  });

  it('hides a block in a track that is not shown', () => {
    expect(narrowGridArea('2 / 2 / 3 / 3', [1, 3])).toBeUndefined();
  });
});

describe('matchesFilters', () => {
  it('leaves track filters to the columns', () => {
    expect(matchesFilters(web, [{ group: FilterGroupKey.track, tag: 'room-2' }])).toBe(true);
  });

  it('matches every filter, by tag or complexity', () => {
    const session = { ...web, complexity: 'Beginner' };

    expect(matchesFilters(session, [])).toBe(true);
    expect(
      matchesFilters(session, [
        { group: FilterGroupKey.tags, tag: 'web' },
        { group: FilterGroupKey.complexity, tag: 'beginner' },
      ]),
    ).toBe(true);
    expect(matchesFilters(session, [{ group: FilterGroupKey.tags, tag: 'android' }])).toBe(false);
  });
});
