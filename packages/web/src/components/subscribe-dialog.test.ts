import { Failure, Initialized, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { subscribeBlock } from '../utils/data';
import type { SubscribeDialog } from './subscribe-dialog';
import './subscribe-dialog';

describe('subscribe-dialog', () => {
  it('defines a component', () => {
    expect(customElements.get('subscribe-dialog')).toBeDefined();
  });

  it('renders the three form fields and default action labels', async () => {
    const { element, shadowRoot } = await fixture<SubscribeDialog>(
      html`<subscribe-dialog></subscribe-dialog>`,
    );
    element['title'] = subscribeBlock.formTitle;
    element['submitLabel'] = subscribeBlock.subscribe;
    await element.updateComplete;

    expect(shadowRoot.querySelector('[slot="headline"]')).toHaveTextContent(
      subscribeBlock.formTitle,
    );
    expect(shadowRoot.querySelectorAll('md-outlined-text-field')).toHaveLength(3);
    expect(shadowRoot.querySelector('md-filled-button')).toHaveTextContent(
      subscribeBlock.subscribe,
    );
  });

  it('shows the general error message when subscribing fails', async () => {
    const { element, shadowRoot } = await fixture<SubscribeDialog>(
      html`<subscribe-dialog></subscribe-dialog>`,
    );
    element['errorOccurred'] = true;
    await element.updateComplete;

    expect(shadowRoot.querySelector('.general-error')).toHaveTextContent(
      subscribeBlock.generalError,
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

    shadowRoot.querySelector<HTMLElement>('md-filled-button')!.click();
    await element.updateComplete;

    expect((shadowRoot.querySelector('#firstFieldInput') as { error?: boolean })!.error).toBe(true);
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
    shadowRoot.querySelector<HTMLElement>('md-filled-button')!.click();

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

    shadowRoot.querySelector<HTMLElement>('md-outlined-button')!.click();

    expect(dialog.close).toHaveBeenCalled();
    expect(element['errorOccurred']).toBe(false);
  });

  it('closes the dialog when subscribed succeeds', async () => {
    const { element } = await fixture<SubscribeDialog>(html`<subscribe-dialog></subscribe-dialog>`);

    element.stateChanged({
      subscribed: new Success(true),
      potentialPartners: new Initialized(),
      dialogs: new Initialized(),
      ui: { videoDialog: { open: false, youtubeId: '', title: '' } },
    } as never);

    expect(element['open']).toBe(false);
  });

  it('shows the general error when subscribing fails', async () => {
    const { element } = await fixture<SubscribeDialog>(html`<subscribe-dialog></subscribe-dialog>`);

    element.stateChanged({
      subscribed: new Failure(new Error('boom')),
      potentialPartners: new Initialized(),
      dialogs: new Initialized(),
      ui: { videoDialog: { open: false, youtubeId: '', title: '' } },
    } as never);

    expect(element['errorOccurred']).toBe(true);
  });
});
