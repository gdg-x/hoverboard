import { Success } from '@abraham/remotedata';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { deepQuerySelector, deepQuerySelectorAll, screen } from 'shadow-dom-testing-library';
import { fixture } from '../../__tests__/helpers/fixtures';
import { setFeatures } from '../../__tests__/helpers/features';
import type { BuiltSession } from '../schedule/build-schedule';
import type { SaveButton } from '../components/schedule/save-button';
import type { SessionChips } from '../components/schedule/session-chips';
import type { SessionReactions } from '../components/schedule/session-reactions';
import { selectSession } from '../store/sessions/selectors';
import { openVideoDialog } from '../store/ui';
import { acceptingFeedback } from '../utils/feedback';
import { updateImageMetadata, updateTextMetadata } from '../utils/metadata';
import { goto } from '../utils/navigation';
import { setStoreState } from '../../__tests__/helpers/store';
import { store } from '../store';
import { getScheduleDay } from '../utils/dates';
import { wallClock, zonedTime } from '../utils/time-zone';
import { otherTimeZone } from '../utils/visitor-time';
import { isLive, sessionStream } from '../utils/stream';
import { feedbackBlock, reactionsRow, type SessionPage } from './session-page';
import './session-page';

vi.mock('../utils/metadata');
vi.mock('../utils/feedback');
vi.mock('../utils/stream');
vi.mock('../utils/visitor-time', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/visitor-time')>()),
  otherTimeZone: vi.fn(() => true),
}));
vi.mock('../store/reactions', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../store/reactions')>()),
  watchSessionReactions: vi.fn(),
  unwatchSessionReactions: vi.fn(),
}));
vi.mock('../utils/navigation', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../utils/navigation')>()),
  goto: vi.fn(),
}));
vi.mock('../store/sessions/selectors', () => ({
  selectSession: vi.fn(),
}));
vi.mock('../store/ui', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/ui')>()),
  openVideoDialog: vi.fn(),
}));

const speaker = {
  id: 'speaker-1',
  name: 'Ada Lovelace',
  photoUrl: '/ada.jpg',
  company: 'Example',
  country: 'UK',
};

const session = {
  id: 'session-1',
  title: 'A great talk',
  description: 'Session description',
  day: '2024-01-02',
  startTime: '10:00',
  endTime: '10:40',
  duration: { hh: 0, mm: 40 },
  track: { id: 'main-hall', title: 'Main hall' },
  complexity: 'Beginner',
  language: 'English',
  presentation: 'https://slides.example',
  videoId: 'abc123',
  tags: ['Web'],
  speakers: [speaker],
} as never as BuiltSession;

const render = async (props: Partial<SessionPage> = {}) => {
  const result = await fixture<SessionPage>(html`<session-page></session-page>`);
  Object.assign(result.element, {
    sessions: new Success([session]),
    sessionId: 'session-1',
    ...props,
  });
  await result.element.updateComplete;
  await result.element.updateComplete;
  return result;
};

describe('session-page', () => {
  // Otherwise it can finish loading after jsdom is gone, which fails the run.
  beforeAll(() => Promise.all([feedbackBlock, reactionsRow]));

  beforeEach(() => {
    vi.mocked(selectSession).mockReturnValue(session);
    vi.mocked(acceptingFeedback).mockReturnValue(false);
    vi.mocked(isLive).mockReturnValue(false);
    vi.mocked(sessionStream).mockReturnValue('https://stream.example/main');
    vi.mocked(otherTimeZone).mockReturnValue(true);
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.restoreAllMocks();
    vi.clearAllMocks();
    vi.useRealTimers();
  });

  it('titles the page with the session and keeps its share image', async () => {
    await render();

    expect(screen.getByShadowRole('heading', { level: 1 })).toHaveTextContent('A great talk');
    expect(updateTextMetadata).toHaveBeenCalledWith('A great talk', 'Session description');
    expect(updateImageMetadata).not.toHaveBeenCalled();
  });

  it("uses the first speaker's photo without share images", async () => {
    setFeatures({ socialImages: false });
    await render();

    expect(updateImageMetadata).toHaveBeenCalledWith('A great talk', 'Session description', {
      image: '/ada.jpg',
      imageAlt: 'Ada Lovelace',
    });
  });

  it('shows when, where and what as chips, naming the sponsor', async () => {
    const { shadowRoot } = await render();
    const chips = deepQuerySelector<SessionChips>(shadowRoot, 'session-chips.details')!;

    expect(chips.details).toEqual([
      'January 2',
      '10:00–10:40',
      '40 min',
      'Main hall',
      'Beginner',
      'English',
    ]);
    expect(chips.session).toBe(session);
    expect(chips.nameSponsor).toBe(true);
    expect(chips).toHaveAttribute('label', 'Session details');
  });

  it("shows the day and times in the visitor's time zone when they chose so", async () => {
    setStoreState({ ui: { ...store.getState().ui, localTime: true } });
    const { shadowRoot } = await render();
    const start = wallClock(zonedTime('2024-01-02', '10:00', 'Europe/Kyiv'));
    const end = wallClock(zonedTime('2024-01-02', '10:40', 'Europe/Kyiv'));

    expect(deepQuerySelector<SessionChips>(shadowRoot, 'session-chips.details')!.details).toEqual([
      getScheduleDay(start.date),
      `${start.time}–${end.time} (your time)`,
      '40 min',
      'Main hall',
      'Beginner',
      'English',
    ]);
  });

  it("keeps the event's times when the visitor is in its time zone", async () => {
    vi.mocked(otherTimeZone).mockReturnValue(false);
    setStoreState({ ui: { ...store.getState().ui, localTime: true } });
    const { shadowRoot } = await render();

    expect(deepQuerySelector<SessionChips>(shadowRoot, 'session-chips.details')!.details).toContain(
      '10:00–10:40',
    );
  });

  it('leaves out the language when the session has none', async () => {
    vi.mocked(selectSession).mockReturnValue({ ...session, language: undefined } as never);
    const { shadowRoot } = await render();

    expect(deepQuerySelector<SessionChips>(shadowRoot, 'session-chips')!.details).not.toContain(
      'English',
    );
  });

  it('links back to the schedule day of the session', async () => {
    await render();

    expect(screen.getByShadowRole('link', { name: 'Back to schedule' })).toHaveAttribute(
      'href',
      '/schedule/2024-01-02',
    );
  });

  it('shows the description and the speakers as cards', async () => {
    const { shadowRoot } = await render();

    expect(deepQuerySelector(shadowRoot, 'short-markdown')).toHaveProperty(
      'content',
      'Session description',
    );
    expect(deepQuerySelector(shadowRoot, 'speaker-card')).toHaveProperty('speaker', speaker);
  });

  it('skips a speaker that does not exist', async () => {
    vi.mocked(selectSession).mockReturnValue({
      ...session,
      speakers: [speaker, { id: 12, sessions: null }],
    } as never);
    const { shadowRoot } = await render();

    expect(deepQuerySelectorAll(shadowRoot, 'speaker-card')).toHaveLength(1);
  });

  it('goes to the 404 page for a missing session', async () => {
    vi.mocked(selectSession).mockReturnValue(undefined);
    await render({ sessionId: 'missing' });

    expect(goto).toHaveBeenCalledWith('/404');
  });

  it('saves the session from a full button', async () => {
    const { shadowRoot } = await render();
    const save = deepQuerySelector<SaveButton>(shadowRoot, 'save-button.save')!;

    expect(save.session).toBe(session);
    expect(save.variant).toBe('button');
  });

  it('has no save button when My Schedule is off', async () => {
    setFeatures({ mySchedule: false });
    const { shadowRoot } = await render();

    expect(deepQuerySelector(shadowRoot, 'save-button')).toBeNull();
  });

  it('shows the reactions to the session', async () => {
    const { shadowRoot } = await render();

    expect(
      deepQuerySelector<SessionReactions>(shadowRoot, 'session-reactions.reactions')!.session,
    ).toBe(session);
  });

  it('has no reactions when reactions are off', async () => {
    setFeatures({ reactions: false });
    const { shadowRoot } = await render();

    expect(deepQuerySelector(shadowRoot, 'session-reactions')).toBeNull();
  });

  it('plays the video and links the slides', async () => {
    await render();

    fireEvent.click(await screen.findByShadowRole('button', { name: 'View video' }));

    expect(openVideoDialog).toHaveBeenCalledWith({ title: 'A great talk', youtubeId: 'abc123' });
    expect(screen.getByShadowRole('link', { name: 'View presentation' })).toHaveAttribute(
      'href',
      'https://slides.example',
    );
  });

  it('asks for feedback only once the session started', async () => {
    const { shadowRoot } = await render();

    expect(deepQuerySelector(shadowRoot, '#feedback')).toBeNull();

    litRender(nothing, document.body);
    vi.mocked(acceptingFeedback).mockReturnValue(true);
    const started = await render();

    expect(deepQuerySelector(started.shadowRoot, '#feedback feedback-block')).toHaveProperty(
      'sessionId',
      'session-1',
    );
  });

  it('never asks for feedback when feedback is off', async () => {
    setFeatures({ feedback: false });
    vi.mocked(acceptingFeedback).mockReturnValue(true);
    const { shadowRoot } = await render();

    expect(deepQuerySelector(shadowRoot, '#feedback')).toBeNull();
  });

  describe('watch live', () => {
    it('links to the stream first while the session is on', async () => {
      vi.mocked(isLive).mockReturnValue(true);
      const { shadowRoot } = await render();

      const button = deepQuerySelector(shadowRoot, '.live-button');
      expect(button).toHaveTextContent('Watch live');
      expect(button).toHaveAttribute('href', 'https://stream.example/main');
      expect(button).toHaveAttribute('target', '_blank');
      expect(deepQuerySelector(shadowRoot, '.actions > :first-child')).toBe(button);
      expect(sessionStream).toHaveBeenCalledWith(session);
    });

    it('has no link before or after the session, or without a stream', async () => {
      const { shadowRoot } = await render();
      expect(deepQuerySelector(shadowRoot, '.live-button')).toBeNull();

      litRender(nothing, document.body);
      vi.mocked(isLive).mockReturnValue(true);
      vi.mocked(sessionStream).mockReturnValue(undefined);
      const withoutStream = await render();
      expect(deepQuerySelector(withoutStream.shadowRoot, '.live-button')).toBeNull();
    });

    it('checks each minute whether the session is on', async () => {
      vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] });
      const { element, shadowRoot } = await render();
      expect(deepQuerySelector(shadowRoot, '.live-button')).toBeNull();

      vi.mocked(isLive).mockReturnValue(true);
      vi.advanceTimersByTime(60 * 1000);
      await element.updateComplete;

      expect(deepQuerySelector(shadowRoot, '.live-button')).not.toBeNull();
    });
  });
});
