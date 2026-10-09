import { Success } from '@abraham/remotedata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setFeatures } from '../../../__tests__/helpers/features';
import type { Session } from '../../models/session';
import type { User } from '../../models/user';
import { openFeedbackDialog, openSigninDialog } from '../../store/dialogs';
import { setUserFeaturedSessions } from '../../store/featured-sessions';
import { queueComplexSnackbar } from '../../store/snackbars';
import { acceptingFeedback } from '../../utils/feedback';
import { confetti } from '../../utils/confetti';
import { formatDuration, type ScheduleSession, type SessionElement } from './session-element';
import './session-element';

vi.mock('../../store/dialogs', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  openFeedbackDialog: vi.fn(),
  openSigninDialog: vi.fn(),
}));
vi.mock('../../store/featured-sessions', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/featured-sessions')>()),
  setUserFeaturedSessions: vi.fn(),
}));
vi.mock('../../store/snackbars', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/snackbars')>()),
  queueComplexSnackbar: vi.fn(),
}));
vi.mock('../../utils/feedback');
vi.mock('../../utils/confetti');

const mockAcceptingFeedback = vi.mocked(acceptingFeedback);
const mockQueueComplexSnackbar = vi.mocked(queueComplexSnackbar);

const session: ScheduleSession = {
  id: 'session-1',
  title: 'Example Session',
  description: 'A great session',
  language: 'English',
  complexity: 'Intermediate',
  tags: ['Web', 'Cloud'],
  mainTag: 'Web',
  track: { title: 'Main hall' },
  duration: { hh: 0, mm: 40 },
  speakers: [{ name: 'Ada', company: 'Example', country: 'UK', photoUrl: '/ada.jpg' }],
};

const render = async (props: Partial<SessionElement> = {}) => {
  const result = await fixture<SessionElement>(html`<session-element></session-element>`);
  Object.assign(result.element, { session: session as unknown as Session, ...props });
  await result.element.updateComplete;
  // `acceptingFeedback` is set after the first render.
  await result.element.updateComplete;
  return { ...result, view: within(result.shadowRootForWithin) };
};

describe('session-element', () => {
  beforeEach(() => {
    mockAcceptingFeedback.mockReturnValue(false);
    mockQueueComplexSnackbar.mockReturnValue({ type: 'queueComplexSnackbar' } as never);
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.clearAllMocks();
  });

  it('links its title to the session page', async () => {
    const { view } = await render();

    expect(view.getByRole('heading', { level: 3 })).toHaveTextContent('Example Session');
    expect(view.getByRole('link', { name: 'Example Session' })).toHaveAttribute(
      'href',
      '/sessions/session-1',
    );
  });

  it('shows tags as chips, speakers, and the track and duration', async () => {
    const { shadowRoot, view } = await render();

    const chips = shadowRoot.querySelectorAll('hb-chip');
    expect([...chips].map((chip) => chip.textContent)).toEqual(['Web', 'Cloud']);
    expect(chips[0]!.style.getPropertyValue('--hb-chip-color')).toContain('--hb-on-tag-web');
    expect(view.getByText('Ada')).toBeInTheDocument();
    expect(shadowRoot.querySelector('.speakers img')).toHaveAttribute('alt', '');
    expect(shadowRoot.querySelector('.meta')).toHaveTextContent(
      'Main hall · 40 min · Intermediate · English',
    );
  });

  it('skips a speaker that does not exist', async () => {
    const { shadowRoot } = await render({
      session: { ...session, speakers: [...session.speakers!, { id: 12 }] } as never,
    });

    expect(shadowRoot.querySelectorAll('.speakers li')).toHaveLength(1);
  });

  it("draws the stripe in the main tag's color", async () => {
    const { shadowRoot } = await render();

    expect(
      shadowRoot.querySelector<HTMLElement>('.session')!.style.getPropertyValue('--stripe'),
    ).toBe('var(--hb-tag-web, var(--hb-color-outline))');
  });

  it('shows a pressed bookmark for a bookmarked session', async () => {
    const { shadowRoot } = await render({ featuredSessions: new Success({ 'session-1': true }) });
    const bookmark = shadowRoot.querySelector('hb-icon-button')!;

    expect(bookmark).toHaveAttribute('label', 'Bookmark Example Session');
    expect(bookmark.pressed).toBe(true);
    expect(bookmark.querySelector('hoverboard-icon')).toHaveAttribute('name', 'bookmark-check');
  });

  it('asks to sign in before bookmarking', async () => {
    const { shadowRoot } = await render();

    shadowRoot.querySelector<HTMLElement>('hb-icon-button')!.click();

    expect(mockQueueComplexSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Sign in to save sessions' }),
    );
    expect(setUserFeaturedSessions).not.toHaveBeenCalled();
    mockQueueComplexSnackbar.mock.calls[0]![0].action?.callback();
    expect(openSigninDialog).toHaveBeenCalled();
  });

  it('bookmarks the session when signed in', async () => {
    const { shadowRoot } = await render({
      user: new Success({ uid: 'user-1' } as User),
      featuredSessions: new Success({}),
    });

    const button = shadowRoot.querySelector<HTMLElement>('hb-icon-button')!;
    button.click();

    expect(setUserFeaturedSessions).toHaveBeenCalledWith('user-1', { 'session-1': true }, true);
    expect(confetti).toHaveBeenCalledWith(button);
  });

  it('removes a bookmark without confetti', async () => {
    const { shadowRoot } = await render({
      user: new Success({ uid: 'user-1' } as User),
      featuredSessions: new Success({ 'session-1': true }),
    });

    shadowRoot.querySelector<HTMLElement>('hb-icon-button')!.click();

    expect(setUserFeaturedSessions).toHaveBeenCalledWith('user-1', { 'session-1': false }, false);
    expect(confetti).not.toHaveBeenCalled();
  });

  it('has no bookmark when My Schedule is off', async () => {
    setFeatures({ mySchedule: false });
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('hb-icon-button')).toBeNull();
  });

  it('asks for feedback instead of a bookmark while the session takes feedback', async () => {
    mockAcceptingFeedback.mockReturnValue(true);
    const { shadowRoot } = await render();
    const button = shadowRoot.querySelector<HTMLElement>('hb-icon-button')!;

    expect(button).toHaveAttribute('label', 'Rate Example Session');

    button.click();

    expect(openFeedbackDialog).toHaveBeenCalledWith(session);
  });

  it('never asks for feedback when feedback is off', async () => {
    setFeatures({ feedback: false });
    mockAcceptingFeedback.mockReturnValue(true);
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('hb-icon-button')).toHaveAttribute(
      'label',
      'Bookmark Example Session',
    );
  });
});

describe('formatDuration', () => {
  it('leaves out zero parts', () => {
    expect(formatDuration({ hh: 1, mm: 30 })).toBe('1 hr 30 min');
    expect(formatDuration({ hh: 2, mm: 0 })).toBe('2 hr');
    expect(formatDuration({ hh: 0, mm: 45 })).toBe('45 min');
  });
});
