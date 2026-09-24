import { beforeEach, describe, expect, it } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { Success } from '@abraham/remotedata';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { SubscribeFormFooter } from './subscribe-form-footer';
import { subscribeBlock } from '../utils/data';
import './subscribe-form-footer';

describe('subscribe-form-footer', () => {
  let element!: SubscribeFormFooter;
  let shadowRoot!: ShadowRoot;

  beforeEach(async () => {
    const render = await fixture<SubscribeFormFooter>(
      html`<subscribe-form-footer></subscribe-form-footer>`,
    );
    element = render.element;
    shadowRoot = render.shadowRoot;
  });

  it('defines a component', () => {
    expect(customElements.get('subscribe-form-footer')).toBeDefined();
  });

  it('renders the subscription form with a disabled submit action', () => {
    expect(shadowRoot.querySelector('[label]')).toHaveAttribute('label', subscribeBlock.yourEmail);
    expect(shadowRoot.querySelector('md-filled-button')).toHaveTextContent(
      subscribeBlock.subscribe,
    );
    expect(shadowRoot.querySelector('md-filled-button')).toBeDisabled();
  });

  it('enables submission when the email input changes', async () => {
    const emailInput = shadowRoot.querySelector<HTMLInputElement>('#emailInput')!;
    emailInput.value = 'attendee@example.com';

    fireEvent.input(emailInput);
    await element.updateComplete;

    expect(shadowRoot.querySelector('md-filled-button')).toBeEnabled();
  });

  it('shows the subscribed state', async () => {
    element.subscribed = new Success(true);
    await element.updateComplete;

    expect(shadowRoot.querySelector('md-filled-button')).toHaveTextContent(
      subscribeBlock.subscribed,
    );
    expect(shadowRoot.querySelector('md-outlined-text-field')).toBeDisabled();
    expect(shadowRoot.querySelector('hoverboard-icon[name="checked"]')).toBeInTheDocument();
  });
});
