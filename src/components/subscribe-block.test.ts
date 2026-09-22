import { Initialized, Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { openSubscribeDialog } from '../store/dialogs/actions';
import { subscribe } from '../store/subscribe/actions';
import { subscribeBlock } from '../utils/data';
import type { SubscribeBlock } from './subscribe-block';
import './subscribe-block';

jest.mock('../store/dialogs/actions', () => ({
  openSubscribeDialog: jest.fn(),
}));

jest.mock('../store/subscribe/actions', () => ({
  subscribe: jest.fn(),
}));

const mockOpenSubscribeDialog = mocked(openSubscribeDialog);
const mockSubscribe = mocked(subscribe);

describe('subscribe-block', () => {
  it('defines a component', () => {
    expect(customElements.get('subscribe-block')).toBeDefined();
  });

  it('renders the call to action', async () => {
    const { shadowRoot } = await fixture<SubscribeBlock>(html`<subscribe-block></subscribe-block>`);

    expect(shadowRoot).toHaveTextContent(subscribeBlock.callToAction.description);
    expect(shadowRoot.querySelector('.cta-label')).toHaveTextContent(
      subscribeBlock.callToAction.label,
    );
    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute(
      'name',
      'arrow-right-circle',
    );
    expect(shadowRoot.querySelector('md-text-button')).not.toHaveAttribute('disabled');
  });

  it('shows the subscribed state and disables the button', async () => {
    const { element, shadowRoot } = await fixture<SubscribeBlock>(
      html`<subscribe-block></subscribe-block>`,
    );
    element.subscribed = new Success(true);
    await element.updateComplete;

    expect(shadowRoot.querySelector('.cta-label')).toHaveTextContent(subscribeBlock.subscribed);
    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute('name', 'checked');
    expect(shadowRoot.querySelector('md-text-button')).toHaveAttribute('disabled');
  });

  it('opens the subscribe dialog for a signed-out user', async () => {
    mockSubscribe.mockReturnValue(jest.fn(async () => {}));
    const { element, shadowRoot } = await fixture<SubscribeBlock>(
      html`<subscribe-block></subscribe-block>`,
    );
    element.user = new Initialized();
    await element.updateComplete;

    shadowRoot.querySelector<HTMLElement>('md-text-button')!.click();

    expect(mockOpenSubscribeDialog).toHaveBeenCalledWith(
      expect.objectContaining({ title: subscribeBlock.formTitle }),
    );

    const submit = mockOpenSubscribeDialog.mock.calls[0]![0].submit;
    submit({ email: 'attendee@example.com' });
    expect(mockSubscribe).toHaveBeenCalledWith({ email: 'attendee@example.com' });
  });

  it('subscribes directly for a signed-in user with an email', async () => {
    mockSubscribe.mockReturnValue(jest.fn(async () => {}));
    mockOpenSubscribeDialog.mockClear();
    const { element, shadowRoot } = await fixture<SubscribeBlock>(
      html`<subscribe-block></subscribe-block>`,
    );
    element.user = new Success({
      uid: 'user-1',
      displayName: 'Ada Lovelace',
      email: 'ada@example.com',
      phoneNumber: null,
      photoURL: null,
      providerId: 'password',
    });
    await element.updateComplete;

    shadowRoot.querySelector<HTMLElement>('md-text-button')!.click();

    expect(mockOpenSubscribeDialog).not.toHaveBeenCalled();
    expect(mockSubscribe).toHaveBeenCalledWith({
      firstFieldValue: 'Ada',
      secondFieldValue: 'Lovelace',
      email: 'ada@example.com',
    });
  });
});
