import { fireEvent, waitFor } from '@testing-library/dom';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { deepQuerySelector, screen } from 'shadow-dom-testing-library';
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

const emailInput = () => screen.findByShadowRole<HTMLInputElement>('textbox', { name: 'Email' });

const typeEmail = async (email: string) => {
  const input = await emailInput();
  input.value = email;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
};

const field = (shadowRoot: ShadowRoot) =>
  deepQuerySelector<HbTextField>(shadowRoot, 'hb-text-field');

const emailButton = (name = 'Email me a sign-in link') =>
  screen.findByShadowRole('button', { name });

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

    expect(field(shadowRoot)).toHaveAttribute('label', 'Email');
    expect(field(shadowRoot)).toHaveAttribute('type', 'email');
    expect(await emailButton()).toBeInTheDocument();
  });

  it('emails a link and says where it went', async () => {
    vi.mocked(sendSignInLink).mockResolvedValue();
    await render();

    await typeEmail('ada@example.com');
    fireEvent.click(await emailButton());

    expect(sendSignInLink).toHaveBeenCalledWith('ada@example.com');
    expect(await screen.findByShadowRole('status')).toHaveTextContent(
      'Check your email. We sent a sign-in link to ada@example.com.',
    );
  });

  it('sends the link on Enter', async () => {
    vi.mocked(sendSignInLink).mockResolvedValue();
    await render();

    await typeEmail('ada@example.com');
    fireEvent.keyDown(await emailInput(), { key: 'Enter' });

    expect(sendSignInLink).toHaveBeenCalledWith('ada@example.com');
  });

  it('goes back to the email field, keeping the address, when reset', async () => {
    vi.mocked(sendSignInLink).mockResolvedValue();
    const { element, shadowRoot } = await render();
    await typeEmail('ada@example.com');
    fireEvent.click(await emailButton());
    await screen.findByShadowRole('status');

    element.reset();
    await element.updateComplete;

    expect(screen.queryByShadowRole('status')).not.toBeInTheDocument();
    expect(field(shadowRoot)!.value).toBe('ada@example.com');
  });

  it('does not send a link to an address that is not valid', async () => {
    await render();

    await typeEmail('not an email');
    fireEvent.click(await emailButton());

    expect(sendSignInLink).not.toHaveBeenCalled();
  });

  it('shows an error when the link cannot be sent', async () => {
    vi.mocked(sendSignInLink).mockRejectedValue(new Error('auth/operation-not-allowed'));
    const { shadowRoot } = await render();

    await typeEmail('ada@example.com');
    fireEvent.click(await emailButton());

    await waitFor(() =>
      expect(field(shadowRoot)).toHaveAttribute(
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
    const button = await emailButton('Sign in');

    await typeEmail('grace@example.com');
    fireEvent.click(button);

    expect(finishSignInWithLink).toHaveBeenCalledWith('grace@example.com');
    expect(sendSignInLink).not.toHaveBeenCalled();
    await waitFor(() =>
      expect(field(shadowRoot)).toHaveAttribute(
        'error',
        'Use the email address the link was sent to.',
      ),
    );
  });

  it('needs the internet to send a link', async () => {
    const { element } = await render();
    element['online'] = false;
    await element.updateComplete;

    await typeEmail('ada@example.com');
    expect(await emailButton()).toBeDisabled();
    fireEvent.keyDown(await emailInput(), { key: 'Enter' });

    expect(sendSignInLink).not.toHaveBeenCalled();
  });
});
