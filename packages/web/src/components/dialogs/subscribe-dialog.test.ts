import { Failure, Initialized, Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import { subscribeBlock } from '../../config/site';
import type { DialogForm } from '../../models/dialog-form';
import { closeDialog, DIALOG } from '../../store/dialogs';
import type { HbTextField } from '../ui/hb-text-field';
import type { SubscribeDialog } from './subscribe-dialog';
import './subscribe-dialog';

vi.mock('../../store/dialogs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  closeDialog: vi.fn(),
}));

const partnerForm = (submit = vi.fn()): DialogForm => ({
  title: 'Become a partner!',
  submitLabel: 'Submit',
  firstFieldLabel: 'Full Name',
  secondFieldLabel: 'Company Name',
  submit,
});

const render = async (form?: DialogForm) => {
  const result = await fixture<SubscribeDialog>(html`<subscribe-dialog></subscribe-dialog>`);
  if (form) {
    setStoreState({ dialogs: new Success({ name: DIALOG.SUBSCRIBE, data: form }) });
    await result.element.updateComplete;
  }
  const field = (name: string) =>
    result.shadowRoot.querySelector<HbTextField>(`hb-text-field[name="${name}"]`)!;
  return { ...result, field };
};

const type = async (field: HbTextField, value: string) => {
  await field.updateComplete;
  const input = field.shadowRoot!.querySelector('input')!;
  input.value = value;
  input.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
};

describe('subscribe-dialog', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('is closed, with the default title and labels, until something opens it', async () => {
    const { shadowRoot } = await render();
    const fields = shadowRoot.querySelectorAll('hb-text-field');

    expect(shadowRoot.querySelector('hb-dialog')).not.toHaveAttribute('open');
    expect(shadowRoot.querySelector('hb-dialog')).toHaveAttribute(
      'heading',
      subscribeBlock.formTitle,
    );
    expect([...fields].map((field) => field.getAttribute('label'))).toEqual([
      'First Name *',
      'Last Name *',
      'Email Address *',
    ]);
    expect(fields[2]).toHaveAttribute('type', 'email');
    expect(shadowRoot.querySelector('hb-button')).toHaveTextContent('Subscribe');
  });

  it('opens with the title and labels the opener passes', async () => {
    const { shadowRoot, field } = await render(partnerForm());

    expect(shadowRoot.querySelector('hb-dialog')).toHaveAttribute('open');
    expect(shadowRoot.querySelector('hb-dialog')).toHaveAttribute('heading', 'Become a partner!');
    expect(field('firstFieldValue')).toHaveAttribute('label', 'Full Name *');
    expect(field('secondFieldValue')).toHaveAttribute('label', 'Company Name *');
    expect(shadowRoot.querySelector('hb-button')).toHaveTextContent('Submit');
  });

  it('fills in what the opener knows, and clears the email', async () => {
    const { field } = await render({
      ...partnerForm(),
      firstFieldValue: 'Ada',
      secondFieldValue: 'Analytical Engines',
    });

    expect(field('firstFieldValue').value).toBe('Ada');
    expect(field('secondFieldValue').value).toBe('Analytical Engines');
    expect(field('email').value).toBe('');
  });

  it('needs the internet to send', async () => {
    const { element, shadowRoot } = await render(partnerForm());
    element['online'] = false;
    await element.updateComplete;

    expect(shadowRoot.querySelector('hb-button')).toHaveAttribute('disabled');
    expect(shadowRoot.querySelector('.offline')).toHaveTextContent(
      'Connect to the internet to send this.',
    );
  });

  it('marks the first field that is missing, and does not submit', async () => {
    const submit = vi.fn();
    const { element, shadowRoot, field } = await render(partnerForm(submit));
    await type(field('firstFieldValue'), 'Ada');

    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();
    await element.updateComplete;

    expect(field('firstFieldValue')).toHaveAttribute('error', '');
    expect(field('secondFieldValue')).toHaveAttribute('error', 'Field required.');
    expect(field('email')).toHaveAttribute('error', '');
    expect(submit).not.toHaveBeenCalled();
  });

  it('marks an email address that is not valid', async () => {
    const submit = vi.fn();
    const { element, shadowRoot, field } = await render(partnerForm(submit));
    await type(field('firstFieldValue'), 'Ada');
    await type(field('secondFieldValue'), 'Lovelace');
    await type(field('email'), 'ada@example');

    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();
    await element.updateComplete;

    expect(field('email')).toHaveAttribute('error', 'Please enter a valid email address.');
    expect(submit).not.toHaveBeenCalled();
  });

  it('submits the form data when all fields are valid', async () => {
    const submit = vi.fn();
    const { element, shadowRoot, field } = await render(partnerForm(submit));
    await type(field('firstFieldValue'), 'Ada');
    await type(field('secondFieldValue'), 'Lovelace');
    await type(field('email'), 'ada@example.com');
    await element.updateComplete;

    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();

    expect(submit).toHaveBeenCalledWith({
      email: 'ada@example.com',
      firstFieldValue: 'Ada',
      secondFieldValue: 'Lovelace',
    });
  });

  it('closes when the submission succeeds', async () => {
    const { element } = await render(partnerForm());

    setStoreState({ potentialPartners: new Success(true) });
    await element.updateComplete;

    expect(closeDialog).toHaveBeenCalled();
  });

  it('shows an error when the submission fails, until it closes', async () => {
    const { element, shadowRoot } = await render(partnerForm());

    setStoreState({ subscribed: new Failure(new Error('boom')) });
    await element.updateComplete;

    expect(shadowRoot.querySelector('.general-error')).toHaveTextContent(
      'An error has occurred. Please, try again later.',
    );

    shadowRoot.querySelector('hb-dialog')!.dispatchEvent(new Event('close'));
    await element.updateComplete;

    expect(closeDialog).toHaveBeenCalled();
    expect(shadowRoot.querySelector('.general-error')).toBeNull();
  });

  it('ignores submissions while closed, such as from the subscribe block', async () => {
    const { element, shadowRoot } = await render();

    setStoreState({
      subscribed: new Failure(new Error('boom')),
      potentialPartners: new Initialized(),
    });
    await element.updateComplete;

    expect(closeDialog).not.toHaveBeenCalled();
    expect(shadowRoot.querySelector('.general-error')).toBeNull();
  });
});
