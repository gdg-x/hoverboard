import { Pending, Success } from '@abraham/remotedata';
import { MockedFunction, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { Session } from '../models/session';
import { User } from '../models/user';
import { router } from '../router';
import { setUserFeaturedSessions } from '../store/featured-sessions';
import { selectSession } from '../store/sessions/selectors';
import { queueComplexSnackbar } from '../store/snackbars';
import { openVideoDialog } from '../store/ui';
import { updateImageMetadata } from '../utils/metadata';
import './session-page';
import { SessionPage } from './session-page';

vi.mock('../utils/metadata');
vi.mock('../utils/scrolling', () => ({
  scrollToTop: vi.fn(),
}));
vi.mock('../router', () => ({
  router: { urlForName: vi.fn(), render: vi.fn() },
}));
vi.mock('../store/sessions/selectors', () => ({
  selectSession: vi.fn(),
}));
vi.mock('../store/featured-sessions', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/featured-sessions')>()),
  setUserFeaturedSessions: vi.fn(() => Promise.resolve()),
}));
vi.mock('../store/dialogs', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/dialogs')>()),
  openSigninDialog: vi.fn(),
}));
vi.mock('../store/ui', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/ui')>()),
  openVideoDialog: vi.fn(),
  setHeroSettings: vi.fn(),
}));
vi.mock('../store/snackbars', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/snackbars')>()),
  queueComplexSnackbar: vi.fn(() => ({ type: 'noop' })),
}));

const session: Session = {
  description: 'Session description',
  id: 'session-1',
  presentation: 'https://slides.example',
  speakers: ['speaker-1'],
  tags: ['web'],
  title: 'A great talk',
  videoId: 'abc123',
};

const speakers = [
  {
    id: 'speaker-1',
    name: 'Ada Lovelace',
    photoUrl: '/ada.jpg',
    company: 'Example',
    country: 'US',
  },
];

const user: User = { uid: 'user-1' } as User;

describe('session-page', () => {
  it('defines a component', () => {
    expect(customElements.get('session-page')).toBeDefined();
  });

  it('triggers the fetch and starts in the pending state', async () => {
    const { element } = await fixture<SessionPage>(html`<session-page></session-page>`);

    expect(element.sessions).toBeInstanceOf(Pending);
  });

  it('resolves the session from the route and updates metadata', async () => {
    const mockSelectSession = selectSession as MockedFunction<typeof selectSession>;
    const mockUpdateMetadata = vi.mocked(updateImageMetadata);
    mockSelectSession.mockReturnValue({ ...session, speakers: speakers as never } as Session);
    mockUpdateMetadata.mockClear();

    const { element, shadowRoot } = await fixture<SessionPage>(html`<session-page></session-page>`);
    element.sessions = new Success([session]);
    element.onAfterEnter({ params: { id: 'session-1' } } as never);
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('A great talk');
    const markdown = shadowRoot.querySelector('short-markdown') as unknown as {
      content: string;
    };
    expect(markdown.content).toBe('Session description');
    expect(mockUpdateMetadata).toHaveBeenCalledWith('A great talk', 'Session description', {
      image: '/ada.jpg',
      imageAlt: 'Ada Lovelace',
    });
  });

  it('redirects to 404 when the session cannot be found', async () => {
    const mockSelectSession = selectSession as MockedFunction<typeof selectSession>;
    mockSelectSession.mockReturnValue(undefined);
    vi.mocked(router).render.mockClear();

    const { element } = await fixture<SessionPage>(html`<session-page></session-page>`);
    element.sessions = new Success([session]);
    element.onAfterEnter({ params: { id: 'missing' } } as never);
    await element.updateComplete;

    expect(router.render).toHaveBeenCalledWith('/404');
  });

  it('queues a sign-in prompt when toggling a featured session while signed out', async () => {
    const mockSelectSession = selectSession as MockedFunction<typeof selectSession>;
    const mockQueueComplexSnackbar = queueComplexSnackbar as MockedFunction<
      typeof queueComplexSnackbar
    >;
    mockSelectSession.mockReturnValue({ ...session, speakers: speakers as never } as Session);
    mockQueueComplexSnackbar.mockClear();

    const { element, shadowRoot } = await fixture<SessionPage>(html`<session-page></session-page>`);
    element.sessions = new Success([session]);
    element.onAfterEnter({ params: { id: 'session-1' } } as never);
    await element.updateComplete;

    const fab = shadowRoot.querySelector('md-fab');
    expect(fab).not.toBeNull();
    fireEvent.click(fab as Element);

    expect(mockQueueComplexSnackbar).toHaveBeenCalled();
  });

  it('dispatches setUserFeaturedSessions when signed in', async () => {
    const mockSelectSession = selectSession as MockedFunction<typeof selectSession>;
    const mockSetUserFeaturedSessions = setUserFeaturedSessions as MockedFunction<
      typeof setUserFeaturedSessions
    >;
    mockSelectSession.mockReturnValue({ ...session, speakers: speakers as never } as Session);
    mockSetUserFeaturedSessions.mockClear();

    const { element, shadowRoot } = await fixture<SessionPage>(html`<session-page></session-page>`);
    element.user = new Success(user);
    element.featuredSessions = new Success({});
    element.sessions = new Success([session]);
    element.onAfterEnter({ params: { id: 'session-1' } } as never);
    await element.updateComplete;

    const fab = shadowRoot.querySelector('md-fab');
    fireEvent.click(fab as Element);

    expect(mockSetUserFeaturedSessions).toHaveBeenCalledWith('user-1', { 'session-1': true }, true);
  });

  it('opens the video dialog when the video action is clicked', async () => {
    const mockSelectSession = selectSession as MockedFunction<typeof selectSession>;
    const mockOpenVideoDialog = openVideoDialog as MockedFunction<typeof openVideoDialog>;
    mockSelectSession.mockReturnValue({ ...session, speakers: speakers as never } as Session);
    mockOpenVideoDialog.mockClear();

    const { element, shadowRoot } = await fixture<SessionPage>(html`<session-page></session-page>`);
    element.sessions = new Success([session]);
    element.onAfterEnter({ params: { id: 'session-1' } } as never);
    await element.updateComplete;

    const videoAction = Array.from(shadowRoot.querySelectorAll('.action')).find((el) =>
      el.textContent?.includes('View video'),
    );
    fireEvent.click(videoAction as Element);

    expect(mockOpenVideoDialog).toHaveBeenCalledWith({
      title: 'A great talk',
      youtubeId: 'abc123',
    });
  });

  it('shows the feedback prompt only while accepting feedback', async () => {
    const mockSelectSession = selectSession as MockedFunction<typeof selectSession>;
    mockSelectSession.mockReturnValue({
      ...session,
      day: '2000-01-01',
      startTime: '00:00',
      speakers: speakers as never,
    } as Session);

    const { element, shadowRoot } = await fixture<SessionPage>(html`<session-page></session-page>`);
    element.sessions = new Success([session]);
    element.onAfterEnter({ params: { id: 'session-1' } } as never);
    await element.updateComplete;

    expect(shadowRoot.querySelector('auth-required')).toHaveAttribute('hidden');
  });
});
