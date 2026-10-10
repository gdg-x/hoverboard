import { Failure } from '@abraham/remotedata';
import { waitFor } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import {
  finishSignInWithLink,
  hasSignInLink,
  mergeAccounts,
  sendSignInLink,
  signIn,
} from '../../store/auth';
import { closeDialog, openSigninDialog } from '../../store/dialogs';
import { queueSnackbar } from '../../store/snackbars';
import { signInProviders } from '../../config/site';
import { PROVIDER } from '../../utils/providers';
import type { HbTextField } from '../ui/hb-text-field';
import type { SigninDialog } from './signin-dialog';
import './signin-dialog';

const GENERAL_ERROR = 'An error has occurred. Please, try again later.';

vi.mock('../../store/auth', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/auth')>()),
  finishSignInWithLink: vi.fn(),
  hasSignInLink: vi.fn(() => false),
  mergeAccounts: vi.fn(),
  sendSignInLink: vi.fn(),
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
    vi.mocked(hasSignInLink).mockReturnValue(false);
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

  it('needs the internet to sign in', async () => {
    const { element, shadowRoot } = await fixture<SigninDialog>(
      html`<signin-dialog></signin-dialog>`,
    );
    element['online'] = false;
    await element.updateComplete;

    expect(shadowRoot.querySelector('.offline')).toHaveTextContent(
      'Connect to the internet to sign in.',
    );
    for (const button of shadowRoot.querySelectorAll('.sign-in-button, .email-button')) {
      expect(button).toHaveAttribute('disabled');
    }
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

  describe('email link', () => {
    const typeEmail = async (shadowRoot: ShadowRoot, email: string) => {
      const field = shadowRoot.querySelector<HbTextField>('hb-text-field')!;
      await field.updateComplete;
      const input = field.shadowRoot!.querySelector('input')!;
      input.value = email;
      input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
    };

    afterEach(() => {
      litRender(nothing, document.body);
    });

    it('asks for an email address above the other ways to sign in', async () => {
      const { shadowRoot } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);

      expect(shadowRoot.querySelector('hb-text-field')).toHaveAttribute('label', 'Email');
      expect(shadowRoot.querySelector('hb-text-field')).toHaveAttribute('type', 'email');
      expect(shadowRoot.querySelector('.email-button')).toHaveTextContent(
        'Email me a sign-in link',
      );
      expect(shadowRoot.querySelector('.email-link + .or')).toHaveTextContent('or');
    });

    it('emails a link and says where it went', async () => {
      vi.mocked(sendSignInLink).mockResolvedValue();
      const { shadowRoot } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);

      await typeEmail(shadowRoot, 'ada@example.com');
      shadowRoot.querySelector<HTMLElement>('.email-button')!.click();

      expect(sendSignInLink).toHaveBeenCalledWith('ada@example.com');
      await waitFor(() =>
        expect(shadowRoot.querySelector('.link-sent')).toHaveTextContent(
          'Check your email. We sent a sign-in link to ada@example.com.',
        ),
      );
      expect(shadowRoot.querySelector('.link-sent')).toHaveAttribute('role', 'status');
    });

    it('does not send a link to an address that is not valid', async () => {
      const { shadowRoot } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);

      await typeEmail(shadowRoot, 'not an email');
      shadowRoot.querySelector<HTMLElement>('.email-button')!.click();

      expect(sendSignInLink).not.toHaveBeenCalled();
    });

    it('shows an error when the link cannot be sent', async () => {
      vi.mocked(sendSignInLink).mockRejectedValue(new Error('auth/operation-not-allowed'));
      const { shadowRoot } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);

      await typeEmail(shadowRoot, 'ada@example.com');
      shadowRoot.querySelector<HTMLElement>('.email-button')!.click();

      await waitFor(() =>
        expect(shadowRoot.querySelector('hb-text-field')).toHaveAttribute(
          'error',
          'Could not send the link. Please try again.',
        ),
      );
    });

    it('finishes signing in from a link opened in another browser', async () => {
      vi.mocked(hasSignInLink).mockReturnValue(true);
      vi.mocked(finishSignInWithLink).mockResolvedValue('wrong-email');
      const { shadowRoot } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);

      expect(shadowRoot.querySelector('.email-link')).toHaveTextContent(
        'Enter your email address again to finish signing in.',
      );
      expect(shadowRoot.querySelector('.email-button')).toHaveTextContent('Sign in');

      await typeEmail(shadowRoot, 'grace@example.com');
      shadowRoot.querySelector<HTMLElement>('.email-button')!.click();

      expect(finishSignInWithLink).toHaveBeenCalledWith('grace@example.com');
      expect(sendSignInLink).not.toHaveBeenCalled();
      await waitFor(() =>
        expect(shadowRoot.querySelector('hb-text-field')).toHaveAttribute(
          'error',
          'Use the email address the link was sent to.',
        ),
      );
    });
  });

  it('says to sign in with an email link when the account was made with one', async () => {
    const { element } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);
    element['auth'] = new Failure({
      code: 'auth/account-exists-with-different-credential',
      credential: { providerId: 'google.com' },
      email: 'attendee@example.com',
      providerId: 'emailLink',
    } as never);

    setStoreState({ auth: element['auth'] });

    expect(mockOpenSigninDialog).not.toHaveBeenCalled();
    expect(mockQueueSnackbar).toHaveBeenCalledWith(
      'attendee@example.com signed in with an email link before. Sign in that way.',
    );
  });
});
