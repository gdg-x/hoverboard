import { Failure } from '@abraham/remotedata';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import { mergeAccounts, signIn } from '../../store/auth';
import { closeDialog, openSigninDialog } from '../../store/dialogs';
import { queueSnackbar } from '../../store/snackbars';
import { signInProviders } from '../../config/site';
import { PROVIDER } from '../../utils/providers';
import type { SigninDialog } from './signin-dialog';
import './signin-dialog';

const GENERAL_ERROR = 'An error has occurred. Please, try again later.';

vi.mock('../../store/auth', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/auth')>()),
  mergeAccounts: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock('../../store/dialogs', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  closeDialog: vi.fn(),
  openSigninDialog: vi.fn(),
}));

vi.mock('../../store/snackbars', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/snackbars')>()),
  queueSnackbar: vi.fn((label: string) => ({ type: 'snackbars/queueSnackbar', payload: label })),
}));

const mockMergeAccounts = vi.mocked(mergeAccounts);
const mockSignIn = vi.mocked(signIn);
const mockCloseDialog = vi.mocked(closeDialog);
const mockOpenSigninDialog = vi.mocked(openSigninDialog);
const mockQueueSnackbar = vi.mocked(queueSnackbar);

describe('signin-dialog', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });
  it('defines a component', () => {
    expect(customElements.get('signin-dialog')).toBeDefined();
  });

  it('renders a button for each sign-in provider', async () => {
    const { shadowRoot } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);

    expect(shadowRoot.querySelector('hb-dialog')).toHaveAttribute('heading', 'Sign in');
    const buttons = shadowRoot.querySelectorAll('.sign-in-button');
    expect(buttons).toHaveLength(signInProviders.providersData.length);
    expect(buttons[0]).toHaveTextContent(`Sign in with ${signInProviders.providersData[0]!.label}`);
    expect(shadowRoot.querySelector('.illustration')).toHaveAttribute('aria-hidden', 'true');
  });

  it('signs in with the clicked provider', async () => {
    const { shadowRoot } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);

    shadowRoot.querySelector<HTMLElement>('.sign-in-button')!.click();

    expect(mockSignIn).toHaveBeenCalledWith(signInProviders.providersData[0]!.url as PROVIDER);
  });

  it('shows the merge-account prompt and merges on click', async () => {
    const { element, shadowRoot } = await fixture<SigninDialog>(
      html`<signin-dialog></signin-dialog>`,
    );
    element['auth'] = new Failure({
      code: 'auth/account-exists-with-different-credential',
      credential: { providerId: 'google.com' },
      email: 'attendee@example.com',
      providerId: PROVIDER['google.com'],
    } as never);
    element['isMergeState'] = true;
    element['email'] = 'attendee@example.com';
    element['providerCompanyName'] = 'Google';
    await element.updateComplete;

    expect(shadowRoot.querySelector('.merge-content')).toHaveTextContent(
      'You already have an account',
    );
    expect(shadowRoot.querySelector('.explanation')).toHaveTextContent(
      "You've already used attendee@example.com. Sign in with Google to continue.",
    );
    expect(shadowRoot.querySelector('.merge-button')).toHaveTextContent('Sign in with Google');

    shadowRoot.querySelector<HTMLElement>('.merge-button')!.click();

    expect(mockMergeAccounts).toHaveBeenCalledWith(
      PROVIDER['google.com'],
      expect.objectContaining({ providerId: 'google.com' }),
    );
    expect(mockCloseDialog).toHaveBeenCalled();
  });

  it('closes and reopens with merge data when auth becomes mergeable', async () => {
    const { element } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);
    element['auth'] = new Failure({
      code: 'auth/account-exists-with-different-credential',
      credential: { providerId: 'google.com' },
      email: 'attendee@example.com',
      providerId: PROVIDER['google.com'],
    } as never);

    setStoreState({ auth: element['auth'] });

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(mockOpenSigninDialog).toHaveBeenCalled();
  });

  it('queues an error snackbar and does not reopen dialog if email is missing', async () => {
    const { element } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);
    element['auth'] = new Failure({
      code: 'auth/account-exists-with-different-credential',
      credential: { providerId: 'google.com' },
      email: undefined,
      providerId: PROVIDER['google.com'],
    } as never);

    setStoreState({ auth: element['auth'] });

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(mockOpenSigninDialog).not.toHaveBeenCalled();
    expect(mockQueueSnackbar).toHaveBeenCalledWith(GENERAL_ERROR);
  });

  it('queues an error snackbar and does not reopen dialog if providerId is missing', async () => {
    const { element } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);
    element['auth'] = new Failure({
      code: 'auth/account-exists-with-different-credential',
      credential: { providerId: 'google.com' },
      email: 'attendee@example.com',
      providerId: undefined,
    } as never);

    setStoreState({ auth: element['auth'] });

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(mockOpenSigninDialog).not.toHaveBeenCalled();
    expect(mockQueueSnackbar).toHaveBeenCalledWith(GENERAL_ERROR);
  });

  it('dispatches closeDialog when the dialog is closed', async () => {
    const { shadowRoot } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);

    shadowRoot.querySelector('hb-dialog')!.dispatchEvent(new Event('close'));

    expect(mockCloseDialog).toHaveBeenCalled();
  });
});
