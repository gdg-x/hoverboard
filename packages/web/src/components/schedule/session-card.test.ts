import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { within } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setFeatures } from '../../../__tests__/helpers/features';
import type { BuiltSession } from '../../schedule/build-schedule';
import { openFeedbackDialog } from '../../store/dialogs';
import { acceptingFeedback } from '../../utils/feedback';
import type { BookmarkButton } from './bookmark-button';
import { formatDuration, type SessionCard } from './session-card';
import type { SessionChips } from './session-chips';
import './session-card';

vi.mock('../../store/dialogs', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  openFeedbackDialog: vi.fn(),
}));
vi.mock('../../utils/feedback');

const mockAcceptingFeedback = vi.mocked(acceptingFeedback);

const session = {
  id: 'session-1',
  title: 'Example Session',
  description: 'A great session',
  language: 'English',
  complexity: 'Intermediate',
  tags: ['Web', 'Cloud'],
  mainTag: 'Web',
  track: { id: 'main-hall', title: 'Main hall' },
  duration: { hh: 0, mm: 40 },
  speakers: [{ name: 'Ada', company: 'Example', country: 'UK', photoUrl: '/ada.jpg' }],
} as never as BuiltSession;

const render = async (props: Partial<SessionCard> = {}) => {
  const result = await fixture<SessionCard>(html`<session-card></session-card>`);
  Object.assign(result.element, { session, ...props });
  await result.element.updateComplete;
  // `acceptingFeedback` is set after the first render.
  await result.element.updateComplete;
  return { ...result, view: within(result.shadowRootForWithin) };
};

describe('session-card', () => {
  beforeEach(() => {
    mockAcceptingFeedback.mockReturnValue(false);
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

  it('shows its chips, speakers, and the track and duration', async () => {
    const { shadowRoot, view } = await render();

    const chips = shadowRoot.querySelector<SessionChips>('session-chips.chips')!;
    expect(chips.session).toBe(session);
    expect(chips.nameSponsor).toBe(false);
    expect(view.getByText('Ada')).toBeInTheDocument();
    expect(shadowRoot.querySelector('.speakers speaker-photo')).toHaveAttribute('size', 'xs');
    expect(shadowRoot.querySelector('.meta')).toHaveTextContent(
      'Main hall · 40 min · Intermediate · English',
    );
  });

  it('shows the chips of a sponsored session without tags', async () => {
    const { shadowRoot } = await render({
      session: { ...session, tags: [], sponsor: 'Acme' },
    });

    expect(shadowRoot.querySelector('session-chips')).toBeInTheDocument();
  });

  it('has no chips without tags or a sponsor', async () => {
    const { shadowRoot } = await render({ session: { ...session, tags: [] } });

    expect(shadowRoot.querySelector('session-chips')).toBeNull();
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

  it('bookmarks the session from an icon button', async () => {
    const { shadowRoot } = await render();
    const bookmark = shadowRoot.querySelector<BookmarkButton>('bookmark-button.action')!;

    expect(bookmark.session).toBe(session);
    expect(bookmark.variant).toBe('icon');
  });

  it('has no bookmark when My Schedule is off', async () => {
    setFeatures({ mySchedule: false });
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('bookmark-button')).toBeNull();
  });

  it('asks for feedback instead of a bookmark while the session takes feedback', async () => {
    mockAcceptingFeedback.mockReturnValue(true);
    const { shadowRoot } = await render();
    const button = shadowRoot.querySelector<HTMLElement>('hb-icon-button.feedback')!;

    expect(shadowRoot.querySelector('bookmark-button')).toBeNull();
    expect(button).toHaveAttribute('label', 'Rate Example Session');

    button.click();

    expect(openFeedbackDialog).toHaveBeenCalledWith(session);
  });

  it('never asks for feedback when feedback is off', async () => {
    setFeatures({ feedback: false });
    mockAcceptingFeedback.mockReturnValue(true);
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('hb-icon-button.feedback')).toBeNull();
    expect(shadowRoot.querySelector('bookmark-button')).toBeInTheDocument();
  });
});

describe('formatDuration', () => {
  it('leaves out zero parts', () => {
    expect(formatDuration({ hh: 1, mm: 30 })).toBe('1 hr 30 min');
    expect(formatDuration({ hh: 2, mm: 0 })).toBe('2 hr');
    expect(formatDuration({ hh: 0, mm: 45 })).toBe('45 min');
  });
});
