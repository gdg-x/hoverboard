import { Failure, Initialized, Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import { subscribeBlock } from '../../config/site';
import type { SubscribeDialog } from './subscribe-dialog';
import './subscribe-dialog';

afterEach(() => {
  vi.restoreAllMocks();
});

describe('subscribe-dialog', () => {
  it('defines a component', () => {
    expect(customElements.get('subscribe-dialog')).toBeDefined();
  });

  it('renders the three form fields and default action labels', async () => {
    const { element, shadowRoot } = await fixture<SubscribeDialog>(
      html`<subscribe-dialog></subscribe-dialog>`,
    );
    element['title'] = subscribeBlock.formTitle;
    await element.updateComplete;

    expect(shadowRoot.querySelector('[slot="headline"]')).toHaveTextContent(
      subscribeBlock.formTitle,
    );
    const fields = shadowRoot.querySelectorAll('hb-text-field');
    expect(fields).toHaveLength(3);
    expect(fields[0]).toHaveAttribute('label', 'First Name *');
    expect(fields[1]).toHaveAttribute('label', 'Last Name *');
    expect(fields[2]).toHaveAttribute('label', 'Email Address *');
    expect(shadowRoot.querySelector('hb-button')).toHaveTextContent('Subscribe');
  });

  it('uses the labels the opener passes', async () => {
    const { element, shadowRoot } = await fixture<SubscribeDialog>(
      html`<subscribe-dialog></subscribe-dialog>`,
    );
    element['submitLabel'] = 'Submit';
    element['firstFieldLabel'] = 'Full Name';
    await element.updateComplete;

    expect(shadowRoot.querySelector('#firstFieldInput')).toHaveAttribute('label', 'Full Name *');
    expect(shadowRoot.querySelector('hb-button')).toHaveTextContent('Submit');
  });

  it('shows the general error message when subscribing fails', async () => {
    const { element, shadowRoot } = await fixture<SubscribeDialog>(
      html`<subscribe-dialog></subscribe-dialog>`,
    );
    element['errorOccurred'] = true;
    await element.updateComplete;

    expect(shadowRoot.querySelector('.general-error')).toHaveTextContent(
      'An error has occurred. Please, try again later.',
    );
  });

  it('does not submit when required fields are blank', async () => {
    const submit = () => {
      throw new Error('should not submit');
    };
    const { element, shadowRoot } = await fixture<SubscribeDialog>(
      html`<subscribe-dialog></subscribe-dialog>`,
    );
    element['dialogState'] = new Success({
      name: 'subscribe',
      data: {
        title: 'Title',
        submitLabel: 'Submit',
        firstFieldLabel: 'First',
        secondFieldLabel: 'Last',
        submit,
      },
    } as never);
    await element.updateComplete;

    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();
    await element.updateComplete;

    expect((shadowRoot.querySelector('#firstFieldInput') as { error?: string })!.error).toBe(
      'Field required.',
    );
  });

  it('submits the form data when all fields are valid', async () => {
    const submit = vi.fn();
    const { element, shadowRoot } = await fixture<SubscribeDialog>(
      html`<subscribe-dialog></subscribe-dialog>`,
    );
    element['dialogState'] = new Success({
      name: 'subscribe',
      data: {
        title: 'Title',
        submitLabel: 'Submit',
        firstFieldLabel: 'First',
        secondFieldLabel: 'Last',
        submit,
      },
    } as never);
    await element.updateComplete;

    const firstFieldInput = shadowRoot.querySelector<HTMLInputElement>('#firstFieldInput')!;
    firstFieldInput.value = 'Ada';
    fireEvent.input(firstFieldInput);

    const secondFieldInput = shadowRoot.querySelector<HTMLInputElement>('#secondFieldInput')!;
    secondFieldInput.value = 'Lovelace';
    fireEvent.input(secondFieldInput);

    const emailInput = shadowRoot.querySelector<HTMLInputElement>('#emailInput')!;
    emailInput.value = 'ada@example.com';
    fireEvent.input(emailInput);

    await element.updateComplete;
    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();

    expect(submit).toHaveBeenCalledWith({
      email: 'ada@example.com',
      firstFieldValue: 'Ada',
      secondFieldValue: 'Lovelace',
    });
  });

  it('closes the dialog and clears the error when the close button is clicked', async () => {
    const { element, shadowRoot } = await fixture<SubscribeDialog>(
      html`<subscribe-dialog></subscribe-dialog>`,
    );
    element['errorOccurred'] = true;
    await element.updateComplete;
    const dialog = shadowRoot.querySelector('hoverboard-dialog') as HTMLElement & {
      close: () => void;
    };
    dialog.close = vi.fn();

    shadowRoot.querySelector<HTMLElement>('hb-button[variant="outlined"]')!.click();

    expect(dialog.close).toHaveBeenCalled();
    expect(element['errorOccurred']).toBe(false);
  });

  it('closes the dialog when subscribed succeeds', async () => {
    const { element } = await fixture<SubscribeDialog>(html`<subscribe-dialog></subscribe-dialog>`);

    setStoreState({
      subscribed: new Success(true),
      potentialPartners: new Initialized(),
      dialogs: new Initialized(),
    });

    expect(element['open']).toBe(false);
  });

  it('shows the general error when subscribing fails', async () => {
    const { element } = await fixture<SubscribeDialog>(html`<subscribe-dialog></subscribe-dialog>`);

    setStoreState({
      subscribed: new Failure(new Error('boom')),
      potentialPartners: new Initialized(),
      dialogs: new Initialized(),
    });

    expect(element['errorOccurred']).toBe(true);
  });
});
