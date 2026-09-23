import { Success } from '@abraham/remotedata';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Session } from '../models/session';
import { User } from '../models/user';
import { router } from '../router';
import { openFeedbackDialog, openSigninDialog } from '../store/dialogs';
import { setUserFeaturedSessions } from '../store/featured-sessions';
import { queueComplexSnackbar } from '../store/snackbars';
import { acceptingFeedback } from '../utils/feedback';
import type { SessionElement } from './session-element';
import './session-element';

vi.mock('../router', () => ({
  router: { urlForName: vi.fn() },
}));
vi.mock('../store/dialogs', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/dialogs')>()),
  openFeedbackDialog: vi.fn(),
  openSigninDialog: vi.fn(),
}));
vi.mock('../store/featured-sessions', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/featured-sessions')>()),
  setUserFeaturedSessions: vi.fn(),
}));
vi.mock('../store/snackbars', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../store/snackbars')>()),
  queueComplexSnackbar: vi.fn(),
}));
vi.mock('../utils/feedback');

const mockUrlForName = vi.mocked(router.urlForName);
const mockOpenFeedbackDialog = vi.mocked(openFeedbackDialog);
const mockOpenSigninDialog = vi.mocked(openSigninDialog);
const mockSetUserFeaturedSessions = vi.mocked(setUserFeaturedSessions);
const mockQueueComplexSnackbar = vi.mocked(queueComplexSnackbar);
const mockAcceptingFeedback = vi.mocked(acceptingFeedback);

const session: Session = {
  id: 'session-1',
  title: 'Example Session',
  description: 'A great session\nwith more details',
  language: 'english',
  complexity: 'intermediate',
  icon: 'presentation',
  tags: ['web'],
  speakers: ['speaker-1'],
};

describe('session-element', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockUrlForName.mockReturnValue('/sessions/session-1');
    mockAcceptingFeedback.mockReturnValue(false);
    mockSetUserFeaturedSessions.mockResolvedValue(undefined);
    mockQueueComplexSnackbar.mockReturnValue({ type: 'queueComplexSnackbar' } as never);
  });

  it('defines a component', () => {
    expect(customElements.get('session-element')).toBeDefined();
  });

  it('renders session details and routes to the session page', async () => {
    const { element, shadowRoot } = await fixture<SessionElement>(
      html`<session-element></session-element>`,
    );
    element.session = session;
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Example Session');
    expect(shadowRoot).toHaveTextContent('A great session');
    expect(shadowRoot.querySelector('a.session')).toHaveAttribute('href', '/sessions/session-1');
    expect(shadowRoot.querySelector('.session-icon')).toHaveAttribute('name', 'presentation');
    expect(shadowRoot.querySelector('.bookmark-session')).toHaveAttribute('name', 'bookmark-plus');
  });

  it('shows the checked bookmark icon when the session is featured', async () => {
    const { element, shadowRoot } = await fixture<SessionElement>(
      html`<session-element></session-element>`,
    );
    element.session = session;
    element.featuredSessions = new Success({ 'session-1': true });
    await element.updateComplete;

    expect(shadowRoot.querySelector('a.session')).toHaveAttribute('featured');
    expect(shadowRoot.querySelector('.bookmark-session')).toHaveAttribute('name', 'bookmark-check');
  });

  it('queues a sign-in snackbar when bookmarking while signed out', async () => {
    const { element, shadowRoot } = await fixture<SessionElement>(
      html`<session-element></session-element>`,
    );
    element.session = session;
    await element.updateComplete;

    fireEvent.click(shadowRoot.querySelector('.bookmark-session')!);

    expect(mockQueueComplexSnackbar).toHaveBeenCalledWith(
      expect.objectContaining({ label: 'Sign in to save sessions' }),
    );
    expect(mockSetUserFeaturedSessions).not.toHaveBeenCalled();
  });

  it('bookmarks the session when signed in', async () => {
    const { element, shadowRoot } = await fixture<SessionElement>(
      html`<session-element></session-element>`,
    );
    element.session = session;
    element.user = new Success({ uid: 'user-1' } as User);
    element.featuredSessions = new Success({});
    await element.updateComplete;

    fireEvent.click(shadowRoot.querySelector('.bookmark-session')!);

    expect(mockSetUserFeaturedSessions).toHaveBeenCalledWith('user-1', { 'session-1': true }, true);
  });

  it('shows the feedback action and opens the feedback dialog when accepting feedback', async () => {
    mockAcceptingFeedback.mockReturnValue(true);
    const { element, shadowRoot } = await fixture<SessionElement>(
      html`<session-element></session-element>`,
    );
    element.session = session;
    await element.updateComplete;

    const feedbackAction = shadowRoot.querySelector('.feedback-action')!;
    expect(feedbackAction).not.toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('.bookmark-session')).toHaveAttribute('hidden');

    fireEvent.click(feedbackAction);

    expect(mockOpenFeedbackDialog).toHaveBeenCalledWith(session);
  });

  it('hides the feedback action when not accepting feedback', async () => {
    const { element, shadowRoot } = await fixture<SessionElement>(
      html`<session-element></session-element>`,
    );
    element.session = session;
    await element.updateComplete;

    expect(shadowRoot.querySelector('.feedback-action')).toHaveAttribute('hidden');
    expect(shadowRoot.querySelector('.bookmark-session')).not.toHaveAttribute('hidden');
  });

  it('opens the sign-in dialog action from the queued snackbar', async () => {
    const { element, shadowRoot } = await fixture<SessionElement>(
      html`<session-element></session-element>`,
    );
    element.session = session;
    await element.updateComplete;

    fireEvent.click(shadowRoot.querySelector('.bookmark-session')!);

    const [payload] = mockQueueComplexSnackbar.mock.calls[0]!;
    payload.action?.callback();

    expect(mockOpenSigninDialog).toHaveBeenCalled();
  });
});
