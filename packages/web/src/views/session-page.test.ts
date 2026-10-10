import { Success } from '@abraham/remotedata';
import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest';
import { within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { setFeatures } from '../../__tests__/helpers/features';
import type { BuiltSession } from '../schedule/build-schedule';
import type { SaveButton } from '../components/schedule/save-button';
import type { SessionChips } from '../components/schedule/session-chips';
import { selectSession } from '../store/sessions/selectors';
import { openVideoDialog } from '../store/ui';
import { acceptingFeedback } from '../utils/feedback';
import { updateImageMetadata, updateTextMetadata } from '../utils/metadata';
import { goto } from '../utils/navigation';
import { feedbackBlock, type SessionPage } from './session-page';
import './session-page';

vi.mock('../utils/metadata');
vi.mock('../utils/feedback');
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
  return { ...result, view: within(result.shadowRootForWithin) };
};

describe('session-page', () => {
  // Otherwise it can finish loading after jsdom is gone, which fails the run.
  beforeAll(() => feedbackBlock);

  beforeEach(() => {
    vi.mocked(selectSession).mockReturnValue(session);
    vi.mocked(acceptingFeedback).mockReturnValue(false);
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.clearAllMocks();
  });

  it('titles the page with the session and keeps its share image', async () => {
    const { view } = await render();

    expect(view.getByRole('heading', { level: 1 })).toHaveTextContent('A great talk');
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
    const chips = shadowRoot.querySelector<SessionChips>('session-chips.details')!;

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

  it('leaves out the language when the session has none', async () => {
    vi.mocked(selectSession).mockReturnValue({ ...session, language: undefined } as never);
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector<SessionChips>('session-chips')!.details).not.toContain(
      'English',
    );
  });

  it('links back to the schedule day of the session', async () => {
    const { view } = await render();

    expect(view.getByRole('link', { name: 'Back to schedule' })).toHaveAttribute(
      'href',
      '/schedule/2024-01-02',
    );
  });

  it('shows the description and the speakers as cards', async () => {
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('short-markdown')).toHaveProperty(
      'content',
      'Session description',
    );
    expect(shadowRoot.querySelector('speaker-card')).toHaveProperty('speaker', speaker);
  });

  it('skips a speaker that does not exist', async () => {
    vi.mocked(selectSession).mockReturnValue({
      ...session,
      speakers: [speaker, { id: 12, sessions: null }],
    } as never);
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelectorAll('speaker-card')).toHaveLength(1);
  });

  it('goes to the 404 page for a missing session', async () => {
    vi.mocked(selectSession).mockReturnValue(undefined);
    await render({ sessionId: 'missing' });

    expect(goto).toHaveBeenCalledWith('/404');
  });

  it('saves the session from a full button', async () => {
    const { shadowRoot } = await render();
    const save = shadowRoot.querySelector<SaveButton>('save-button.save')!;

    expect(save.session).toBe(session);
    expect(save.variant).toBe('button');
  });

  it('has no save button when My Schedule is off', async () => {
    setFeatures({ mySchedule: false });
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('save-button')).toBeNull();
  });

  it('plays the video and links the slides', async () => {
    const { shadowRoot } = await render();

    shadowRoot.querySelector<HTMLElement>('.video-button')!.click();

    expect(openVideoDialog).toHaveBeenCalledWith({ title: 'A great talk', youtubeId: 'abc123' });
    expect(shadowRoot.querySelector('hb-button[href="https://slides.example"]')).toHaveTextContent(
      'View presentation',
    );
  });

  it('asks for feedback only once the session started', async () => {
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('#feedback')).toBeNull();

    litRender(nothing, document.body);
    vi.mocked(acceptingFeedback).mockReturnValue(true);
    const started = await render();

    expect(started.shadowRoot.querySelector('#feedback feedback-block')).toHaveProperty(
      'sessionId',
      'session-1',
    );
  });

  it('never asks for feedback when feedback is off', async () => {
    setFeatures({ feedback: false });
    vi.mocked(acceptingFeedback).mockReturnValue(true);
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('#feedback')).toBeNull();
  });
});
