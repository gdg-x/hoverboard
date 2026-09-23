import { Failure, Initialized } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { mergeAccounts, signIn } from '../store/auth';
import { closeDialog, openSigninDialog } from '../store/dialogs';
import { signIn as signInText, signInDialog, signInProviders } from '../utils/data';
import { PROVIDER } from '../utils/providers';
import type { SigninDialog } from './signin-dialog';
import './signin-dialog';

vi.mock('../store/auth', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/auth')>()),
  mergeAccounts: vi.fn(),
  signIn: vi.fn(),
}));

vi.mock('../store/dialogs', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../store/dialogs')>()),
  closeDialog: vi.fn(),
  openSigninDialog: vi.fn(),
}));

const mockMergeAccounts = vi.mocked(mergeAccounts);
const mockSignIn = vi.mocked(signIn);
const mockCloseDialog = vi.mocked(closeDialog);
const mockOpenSigninDialog = vi.mocked(openSigninDialog);

describe('signin-dialog', () => {
  it('defines a component', () => {
    expect(customElements.get('signin-dialog')).toBeDefined();
  });

  it('renders a button for each sign-in provider', async () => {
    const { shadowRoot } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);

    expect(shadowRoot.querySelector('[slot="headline"]')).toHaveTextContent(signInText);
    const buttons = shadowRoot.querySelectorAll('.sign-in-button');
    expect(buttons).toHaveLength(signInProviders.providersData.length);
    expect(buttons[0]).toHaveTextContent(signInProviders.providersData[0]!.label);
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
      signInDialog.alreadyHaveAccount,
    );
    expect(shadowRoot.querySelector('.explanation')).toHaveTextContent('attendee@example.com');

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

    element.stateChanged({
      auth: element['auth'],
      dialogs: new Initialized(),
    } as never);

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(mockOpenSigninDialog).toHaveBeenCalled();
  });

  it('dispatches closeDialog when the dialog is closed', async () => {
    const { shadowRoot } = await fixture<SigninDialog>(html`<signin-dialog></signin-dialog>`);

    shadowRoot.querySelector('hoverboard-dialog')!.dispatchEvent(new Event('closed'));

    expect(mockCloseDialog).toHaveBeenCalled();
  });
});
