import { Success } from '@abraham/remotedata';
import { html, nothing, render as litRender } from 'lit';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import type { BuiltSession } from '../../schedule/build-schedule';
import { store as appStore } from '../../store';
import { sessionStream } from '../../utils/stream';
import { wallClock, zonedTime } from '../../utils/time-zone';
import { NEXT_WINDOW_MS, type OnNowBlock, sessionsAround } from './on-now-block';
import './on-now-block';

const store = vi.hoisted(() => ({ sessions: [] as unknown[] }));

vi.mock('../../store/schedule', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/schedule')>()),
  selectSessionsState: () => new Success(store.sessions),
}));
vi.mock('../../utils/stream', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/stream')>()),
  sessionStream: vi.fn(),
}));
vi.mock('../../utils/visitor-time', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../utils/visitor-time')>()),
  otherTimeZone: () => true,
}));

// The demo event is in Kyiv, UTC+3 in October.
const session = (id: string, startTime: string, endTime: string, extra = {}) =>
  ({
    id,
    title: `Talk ${id}`,
    description: '',
    day: '2017-10-13',
    startTime,
    endTime,
    track: { id: 'main', title: 'Main hall' },
    speakers: [{ name: 'Ada Lovelace' }, { name: 'Grace Hopper' }],
    ...extra,
  }) as never as BuiltSession;

const keynote = session('keynote', '10:00', '11:00');
const talk = session('talk', '11:00', '11:40');
const later = session('later', '12:00', '12:40');
const lunch = { ...session('lunch', '10:00', '11:00'), day: undefined } as never as BuiltSession;
// 10:30 in Kyiv.
const at1030 = new Date('2017-10-13T07:30:00Z').getTime();

describe('sessionsAround', () => {
  it('lists the sessions on now, and the ones starting in the next 30 minutes', () => {
    expect(sessionsAround([later, talk, keynote, lunch], at1030)).toEqual({
      on: [keynote],
      next: [talk],
    });
  });

  it('counts a session as on from its start until its end', () => {
    const atStart = new Date('2017-10-13T07:00:00Z').getTime();
    const atEnd = new Date('2017-10-13T08:00:00Z').getTime();

    expect(sessionsAround([keynote], atStart).on).toEqual([keynote]);
    expect(sessionsAround([keynote], atEnd).on).toEqual([]);
  });

  it('looks 30 minutes ahead, and no further', () => {
    const startOfTalk = new Date('2017-10-13T08:00:00Z').getTime();

    expect(sessionsAround([talk], startOfTalk - NEXT_WINDOW_MS).next).toEqual([talk]);
    expect(sessionsAround([talk], startOfTalk - NEXT_WINDOW_MS - 1).next).toEqual([]);
  });
});

describe('on-now-block', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date', 'setInterval', 'clearInterval'] });
    vi.setSystemTime(at1030);
    vi.mocked(sessionStream).mockReturnValue('https://stream.example/main');
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.useRealTimers();
    vi.restoreAllMocks();
    vi.clearAllMocks();
    store.sessions = [];
  });

  const render = async () => {
    const result = await fixture<OnNowBlock>(html`<on-now-block></on-now-block>`);
    await result.element.updateComplete;
    return result;
  };

  it('shows the sessions on now, then up next, with their times, tracks and speakers', async () => {
    store.sessions = [keynote, talk, later];
    const { element, shadowRoot } = await render();

    expect(element.hidden).toBe(false);
    expect(shadowRoot.querySelector('h2')).toHaveTextContent('On now');
    const [on, next] = shadowRoot.querySelectorAll('ul.sessions');
    expect(on!.querySelectorAll('li')).toHaveLength(1);
    expect(on!.querySelector('.meta')).toHaveTextContent('Until 11:00 · Main hall');
    expect(on!.querySelector('.title a')).toHaveAttribute('href', '/sessions/keynote');
    expect(on!.querySelector('.speakers')).toHaveTextContent('Ada Lovelace, Grace Hopper');
    expect(shadowRoot.querySelector('h3')).toHaveTextContent('Up next');
    expect(next!.querySelector('.meta')).toHaveTextContent('11:00 · Main hall');
    expect(next!.querySelector('.title')).toHaveTextContent('Talk talk');
  });

  it('links to the stream of a session that is on', async () => {
    store.sessions = [keynote, later];
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('.live-button')).toHaveAttribute(
      'href',
      'https://stream.example/main',
    );
    expect(sessionStream).toHaveBeenCalledWith(keynote);
  });

  it('has no stream button without a stream, or for a session that starts later', async () => {
    vi.mocked(sessionStream).mockReturnValue(undefined);
    store.sessions = [keynote];
    const { shadowRoot } = await render();
    expect(shadowRoot.querySelector('.live-button')).toBeNull();

    litRender(nothing, document.body);
    vi.mocked(sessionStream).mockReturnValue('https://stream.example/main');
    store.sessions = [talk];
    vi.setSystemTime(new Date('2017-10-13T07:45:00Z'));
    const upNext = await render();
    expect(upNext.shadowRoot.querySelector('.live-button')).toBeNull();
  });

  it('hides itself when nothing is on or up next', async () => {
    store.sessions = [later];
    const { element, shadowRoot } = await render();

    expect(element.hidden).toBe(true);
    expect(shadowRoot.querySelector('section')).toBeNull();
  });

  it("shows times in the visitor's time zone when they chose so", async () => {
    store.sessions = [keynote, talk];
    setStoreState({ ui: { ...appStore.getState().ui, localTime: true } });
    const { shadowRoot } = await render();
    const time = (at: string) => wallClock(zonedTime('2017-10-13', at, 'Europe/Kyiv')).time;
    const [on, next] = shadowRoot.querySelectorAll('ul.sessions');

    expect(on!.querySelector('.meta')).toHaveTextContent(
      `Until ${time('11:00')} (your time) · Main hall`,
    );
    expect(next!.querySelector('.meta')).toHaveTextContent(`${time('11:00')} (your time)`);
  });

  it('moves on each minute', async () => {
    store.sessions = [keynote, talk];
    const { element, shadowRoot } = await render();

    vi.setSystemTime(new Date('2017-10-13T08:01:00Z'));
    vi.advanceTimersByTime(60 * 1000);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.title')).toHaveTextContent('Talk talk');
    expect(shadowRoot.querySelector('h3')).toBeNull();
  });
});
