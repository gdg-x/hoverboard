import { waitFor } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { finishSignInWithLink, hasSignInLink, sendSignInLink } from '../../store/auth';
import type { HbTextField } from '../ui/hb-text-field';
import type { EmailLinkForm } from './email-link-form';
import './email-link-form';

vi.mock('../../store/auth', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/auth')>()),
  finishSignInWithLink: vi.fn(),
  hasSignInLink: vi.fn(() => false),
  sendSignInLink: vi.fn(),
}));

const render = () => fixture<EmailLinkForm>(html`<email-link-form></email-link-form>`);

const typeEmail = async (shadowRoot: ShadowRoot, email: string) => {
  const field = shadowRoot.querySelector<HbTextField>('hb-text-field')!;
  await field.updateComplete;
  const input = field.shadowRoot!.querySelector('input')!;
  input.value = email;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
};

describe('email-link-form', () => {
  beforeEach(() => {
    vi.mocked(hasSignInLink).mockReturnValue(false);
  });

  afterEach(() => {
    litRender(nothing, document.body);
    vi.clearAllMocks();
  });

  it('asks for an email address to send a link to', async () => {
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('hb-text-field')).toHaveAttribute('label', 'Email');
    expect(shadowRoot.querySelector('hb-text-field')).toHaveAttribute('type', 'email');
    expect(shadowRoot.querySelector('.email-button')).toHaveTextContent('Email me a sign-in link');
  });

  it('emails a link and says where it went', async () => {
    vi.mocked(sendSignInLink).mockResolvedValue();
    const { shadowRoot } = await render();

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

  it('sends the link on Enter', async () => {
    vi.mocked(sendSignInLink).mockResolvedValue();
    const { shadowRoot } = await render();

    await typeEmail(shadowRoot, 'ada@example.com');
    shadowRoot
      .querySelector('hb-text-field')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(sendSignInLink).toHaveBeenCalledWith('ada@example.com');
  });

  it('goes back to the email field, keeping the address, when reset', async () => {
    vi.mocked(sendSignInLink).mockResolvedValue();
    const { element, shadowRoot } = await render();
    await typeEmail(shadowRoot, 'ada@example.com');
    shadowRoot.querySelector<HTMLElement>('.email-button')!.click();
    await waitFor(() => expect(shadowRoot.querySelector('.link-sent')).not.toBeNull());

    element.reset();
    await element.updateComplete;

    expect(shadowRoot.querySelector('.link-sent')).toBeNull();
    expect(shadowRoot.querySelector<HbTextField>('hb-text-field')!.value).toBe('ada@example.com');
  });

  it('does not send a link to an address that is not valid', async () => {
    const { shadowRoot } = await render();

    await typeEmail(shadowRoot, 'not an email');
    shadowRoot.querySelector<HTMLElement>('.email-button')!.click();

    expect(sendSignInLink).not.toHaveBeenCalled();
  });

  it('shows an error when the link cannot be sent', async () => {
    vi.mocked(sendSignInLink).mockRejectedValue(new Error('auth/operation-not-allowed'));
    const { shadowRoot } = await render();

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
    const { shadowRoot } = await render();

    expect(shadowRoot).toHaveTextContent('Enter your email address again to finish signing in.');
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

  it('needs the internet to send a link', async () => {
    const { element, shadowRoot } = await render();
    element['online'] = false;
    await element.updateComplete;

    await typeEmail(shadowRoot, 'ada@example.com');
    const button = shadowRoot.querySelector<HTMLElement>('.email-button')!;
    expect(button).toHaveAttribute('disabled');
    shadowRoot
      .querySelector('hb-text-field')!
      .dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter' }));

    expect(sendSignInLink).not.toHaveBeenCalled();
  });
});
