import { Failure, Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { subscribe } from '../../store/subscribe';
import { subscribeBlock } from '../../config/site';
import type { HbTextField } from '../ui/hb-text-field';
import type { SubscribeBlock } from './subscribe-block';
import './subscribe-block';

vi.mock('../../store/subscribe', async (importOriginal) => ({
  __esModule: true,
  ...(await importOriginal<typeof import('../../store/subscribe')>()),
  subscribe: vi.fn(),
}));

const mockSubscribe = vi.mocked(subscribe);

const signedIn = new Success({
  uid: 'user-1',
  displayName: 'Ada Lovelace',
  email: 'ada@example.com',
  phoneNumber: null,
  photoURL: null,
  providerId: 'password',
});

const typeEmail = async (field: HbTextField, email: string) => {
  await field.updateComplete;
  const input = field.shadowRoot!.querySelector('input')!;
  input.value = email;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
};

describe('subscribe-block', () => {
  afterEach(() => {
    mockSubscribe.mockClear();
    render(nothing, document.body);
  });

  it('defines a component', () => {
    expect(customElements.get('subscribe-block')).toBeDefined();
  });

  it('renders the title, the site text and a labeled email field', async () => {
    const { shadowRoot } = await fixture<SubscribeBlock>(html`<subscribe-block></subscribe-block>`);

    expect(shadowRoot.querySelector('h2')).toHaveTextContent(
      'Get notified about the important conference updates',
    );
    expect(shadowRoot).toHaveTextContent(subscribeBlock.formTitle);
    const field = shadowRoot.querySelector('hb-text-field')!;
    expect(field).toHaveAttribute('label', 'Your email');
    expect(field).toHaveAttribute('type', 'email');
    expect(field).toHaveAttribute('required');
    expect(shadowRoot.querySelector('hb-button')).toHaveTextContent('Subscribe');
    expect(shadowRoot.querySelector('.illustration svg')).toBeInTheDocument();
  });

  it('subscribes the email', async () => {
    const { element, shadowRoot } = await fixture<SubscribeBlock>(
      html`<subscribe-block></subscribe-block>`,
    );
    await typeEmail(shadowRoot.querySelector('hb-text-field')!, 'grace@example.com');
    await element.updateComplete;

    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();

    expect(mockSubscribe).toHaveBeenCalledWith({
      email: 'grace@example.com',
      firstFieldValue: '',
      secondFieldValue: '',
    });
  });

  it('subscribes on Enter in the field', async () => {
    const { element, shadowRoot } = await fixture<SubscribeBlock>(
      html`<subscribe-block></subscribe-block>`,
    );
    const field = shadowRoot.querySelector('hb-text-field')!;
    await typeEmail(field, 'grace@example.com');
    await element.updateComplete;

    field.dispatchEvent(new KeyboardEvent('keydown', { key: 'Enter', bubbles: true }));

    expect(mockSubscribe).toHaveBeenCalledTimes(1);
  });

  it('does not subscribe an invalid email', async () => {
    const { element, shadowRoot } = await fixture<SubscribeBlock>(
      html`<subscribe-block></subscribe-block>`,
    );
    await typeEmail(shadowRoot.querySelector('hb-text-field')!, 'not an email');
    await element.updateComplete;

    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();

    expect(mockSubscribe).not.toHaveBeenCalled();
  });

  it("fills in a signed-in visitor's email and name", async () => {
    const { element, shadowRoot } = await fixture<SubscribeBlock>(
      html`<subscribe-block></subscribe-block>`,
    );
    element.user = signedIn;
    await element.updateComplete;

    expect(shadowRoot.querySelector<HbTextField>('hb-text-field')!.value).toBe('ada@example.com');

    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();

    expect(mockSubscribe).toHaveBeenCalledWith({
      email: 'ada@example.com',
      firstFieldValue: 'Ada',
      secondFieldValue: 'Lovelace',
    });
  });

  it('shows an error when subscribing fails', async () => {
    const { element, shadowRoot } = await fixture<SubscribeBlock>(
      html`<subscribe-block></subscribe-block>`,
    );
    element.subscribed = new Failure(new Error('offline'));
    await element.updateComplete;

    expect(shadowRoot.querySelector('hb-text-field')).toHaveAttribute(
      'error',
      'Could not subscribe. Please try again.',
    );
  });

  it('replaces the form with a status once subscribed', async () => {
    const { element, shadowRoot } = await fixture<SubscribeBlock>(
      html`<subscribe-block></subscribe-block>`,
    );
    element.subscribed = new Success(true);
    await element.updateComplete;

    expect(shadowRoot.querySelector('hb-text-field')).toBeNull();
    expect(shadowRoot.querySelector('[role="status"]')).toHaveTextContent('Subscribed');
  });
});
