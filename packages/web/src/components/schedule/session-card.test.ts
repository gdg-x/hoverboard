import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html, nothing, render as litRender } from 'lit';
import { deepQuerySelector, deepQuerySelectorAll, screen } from 'shadow-dom-testing-library';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setFeatures } from '../../../__tests__/helpers/features';
import type { BuiltSession } from '../../schedule/build-schedule';
import { openFeedbackDialog } from '../../store/dialogs';
import { acceptingFeedback } from '../../utils/feedback';
import { isLive, sessionStream } from '../../utils/stream';
import type { SaveButton } from './save-button';
import { formatDuration, type SessionCard } from './session-card';
import type { SessionChips } from './session-chips';
import './session-card';

vi.mock('../../store/dialogs', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  openFeedbackDialog: vi.fn(),
}));
vi.mock('../../utils/feedback');
vi.mock('../../utils/stream');

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
  return result;
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
    await render();

    expect(screen.getByShadowRole('heading', { level: 3 })).toHaveTextContent('Example Session');
    expect(screen.getByShadowRole('link', { name: 'Example Session' })).toHaveAttribute(
      'href',
      '/sessions/session-1',
    );
  });

  it('shows its chips, speakers, and the track and duration', async () => {
    const { shadowRoot } = await render();

    const chips = deepQuerySelector<SessionChips>(shadowRoot, 'session-chips.chips')!;
    expect(chips.session).toBe(session);
    expect(chips.nameSponsor).toBe(false);
    expect(screen.getByShadowText('Ada')).toBeInTheDocument();
    expect(deepQuerySelector(shadowRoot, '.speakers speaker-photo')).toHaveAttribute('size', 'xs');
    expect(deepQuerySelector(shadowRoot, '.meta')).toHaveTextContent(
      'Main hall · 40 min · Intermediate · English',
    );
  });

  it('shows the chips of a sponsored session without tags', async () => {
    const { shadowRoot } = await render({
      session: { ...session, tags: [], sponsor: 'Acme' },
    });

    expect(deepQuerySelector(shadowRoot, 'session-chips')).toBeInTheDocument();
  });

  it('has no chips without tags or a sponsor', async () => {
    const { shadowRoot } = await render({ session: { ...session, tags: [] } });

    expect(deepQuerySelector(shadowRoot, 'session-chips')).toBeNull();
  });

  it('skips a speaker that does not exist', async () => {
    const { shadowRoot } = await render({
      session: { ...session, speakers: [...session.speakers!, { id: 12 }] } as never,
    });

    expect(deepQuerySelectorAll(shadowRoot, '.speakers li')).toHaveLength(1);
  });

  it("draws the stripe in the main tag's color", async () => {
    await render();

    expect(screen.getByShadowRole('article').style.getPropertyValue('--stripe')).toBe(
      'var(--hb-tag-web, var(--hb-color-outline))',
    );
  });

  it('saves the session from an icon button', async () => {
    const { shadowRoot } = await render();
    const save = deepQuerySelector<SaveButton>(shadowRoot, 'save-button.action')!;

    expect(save.session).toBe(session);
    expect(save.variant).toBe('icon');
  });

  it('has no save button when My Schedule is off', async () => {
    setFeatures({ mySchedule: false });
    const { shadowRoot } = await render();

    expect(deepQuerySelector(shadowRoot, 'save-button')).toBeNull();
  });

  it('asks for feedback instead of saving while the session takes feedback', async () => {
    mockAcceptingFeedback.mockReturnValue(true);
    const { shadowRoot } = await render();
    const button = await screen.findByShadowRole('button', { name: 'Rate Example Session' });

    expect(deepQuerySelector(shadowRoot, 'save-button')).toBeNull();

    fireEvent.click(button);

    expect(openFeedbackDialog).toHaveBeenCalledWith(session);
  });

  it('never asks for feedback when feedback is off', async () => {
    setFeatures({ feedback: false });
    mockAcceptingFeedback.mockReturnValue(true);
    const { shadowRoot } = await render();

    expect(deepQuerySelector(shadowRoot, 'hb-icon-button.feedback')).toBeNull();
    expect(deepQuerySelector(shadowRoot, 'save-button')).toBeInTheDocument();
  });

  describe('live', () => {
    const now = new Date('2024-01-02T08:10:00Z');

    beforeEach(() => {
      vi.mocked(isLive).mockReturnValue(true);
      vi.mocked(sessionStream).mockReturnValue('https://stream.example/main');
    });

    it('says so before the track while the session is on', async () => {
      const { shadowRoot } = await render({ now });

      expect(deepQuerySelector(shadowRoot, '.meta .live')).toHaveTextContent('Live');
      expect(deepQuerySelector(shadowRoot, '.meta')).toHaveTextContent(/^Live\s*Main hall/);
      expect(isLive).toHaveBeenCalledWith(session, now.getTime());
    });

    it('is not live before the schedule sets the time, which the server never does', async () => {
      const { shadowRoot } = await render();

      expect(deepQuerySelector(shadowRoot, '.live')).toBeNull();
      expect(isLive).not.toHaveBeenCalled();
    });

    it('is not live outside the session, or without a stream to watch', async () => {
      vi.mocked(isLive).mockReturnValue(false);
      const { shadowRoot } = await render({ now });
      expect(deepQuerySelector(shadowRoot, '.live')).toBeNull();

      litRender(nothing, document.body);
      vi.mocked(isLive).mockReturnValue(true);
      vi.mocked(sessionStream).mockReturnValue(undefined);
      const withoutStream = await render({ now });
      expect(deepQuerySelector(withoutStream.shadowRoot, '.live')).toBeNull();
    });
  });
});

describe('formatDuration', () => {
  it('leaves out zero parts', () => {
    expect(formatDuration({ hh: 1, mm: 30 })).toBe('1 hr 30 min');
    expect(formatDuration({ hh: 2, mm: 0 })).toBe('2 hr');
    expect(formatDuration({ hh: 0, mm: 45 })).toBe('45 min');
  });
});
