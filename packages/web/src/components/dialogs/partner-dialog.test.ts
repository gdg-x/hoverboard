import { Failure, Initialized, Success } from '@abraham/remotedata';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setStoreState } from '../../../__tests__/helpers/store';
import { closeDialog, DIALOG } from '../../store/dialogs';
import { addPotentialPartner } from '../../store/potential-partners';
import { queueSnackbar } from '../../store/snackbars';
import type { HbTextField } from '../ui/hb-text-field';
import type { PartnerDialog } from './partner-dialog';
import './partner-dialog';

vi.mock('../../store/dialogs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  closeDialog: vi.fn(),
}));
vi.mock('../../store/potential-partners', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/potential-partners')>()),
  addPotentialPartner: vi.fn(),
}));
vi.mock('../../store/snackbars', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/snackbars')>()),
  queueSnackbar: vi.fn((label: string) => ({ type: 'snackbars/queueSnackbar', payload: label })),
}));

const render = async ({ open = true } = {}) => {
  const result = await fixture<PartnerDialog>(html`<partner-dialog></partner-dialog>`);
  if (open) {
    setStoreState({ dialogs: new Success({ name: DIALOG.PARTNER }) });
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

describe('partner-dialog', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    vi.restoreAllMocks();
    vi.clearAllMocks();
  });

  it('is closed until the partner dialog opens', async () => {
    const { shadowRoot } = await render({ open: false });

    expect(shadowRoot.querySelector('hb-dialog')).not.toHaveAttribute('open');
  });

  it("asks for a partner's name, company and email", async () => {
    const { shadowRoot } = await render();
    const fields = [...shadowRoot.querySelectorAll('hb-text-field')];

    expect(shadowRoot.querySelector('hb-dialog')).toHaveAttribute('open');
    expect(shadowRoot.querySelector('hb-dialog')).toHaveAttribute('heading', 'Become a partner!');
    expect(fields.map((field) => field.getAttribute('label'))).toEqual([
      'Full Name *',
      'Company Name *',
      'Email Address *',
    ]);
    expect(fields.map((field) => field.getAttribute('autocomplete'))).toEqual([
      'name',
      'organization',
      'email',
    ]);
    expect(fields[2]).toHaveAttribute('type', 'email');
    expect(shadowRoot.querySelector('hb-button')).toHaveTextContent('Submit');
  });

  it('needs the internet to send', async () => {
    const { element, shadowRoot } = await render();
    element['online'] = false;
    await element.updateComplete;

    expect(shadowRoot.querySelector('hb-button')).toHaveAttribute('disabled');
    expect(shadowRoot.querySelector('.offline')).toHaveTextContent(
      'Connect to the internet to send this.',
    );
  });

  it('marks the first field that is missing, and does not send', async () => {
    const { element, shadowRoot, field } = await render();
    await type(field('fullName'), 'Ada');

    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();
    await element.updateComplete;

    expect(field('fullName')).toHaveAttribute('error', '');
    expect(field('companyName')).toHaveAttribute('error', 'Field required.');
    expect(field('email')).toHaveAttribute('error', '');
    expect(addPotentialPartner).not.toHaveBeenCalled();
  });

  it('marks an email address that is not valid', async () => {
    const { element, shadowRoot, field } = await render();
    await type(field('fullName'), 'Ada');
    await type(field('companyName'), 'Analytical Engines');
    await type(field('email'), 'ada@example');

    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();
    await element.updateComplete;

    expect(field('email')).toHaveAttribute('error', 'Please enter a valid email address.');
    expect(addPotentialPartner).not.toHaveBeenCalled();
  });

  it('sends the request when all fields are valid', async () => {
    const { element, shadowRoot, field } = await render();
    await type(field('fullName'), 'Ada');
    await type(field('companyName'), 'Analytical Engines');
    await type(field('email'), 'ada@example.com');
    await element.updateComplete;

    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();

    expect(addPotentialPartner).toHaveBeenCalledWith({
      fullName: 'Ada',
      companyName: 'Analytical Engines',
      email: 'ada@example.com',
    });
  });

  it('closes and thanks the partner once the request is sent', async () => {
    const { element } = await render();

    setStoreState({ potentialPartners: new Success(true) });
    await element.updateComplete;

    expect(closeDialog).toHaveBeenCalled();
    expect(queueSnackbar).toHaveBeenCalledWith('We will contact you soon!');
  });

  it('shows an error when the request fails, until it closes', async () => {
    const { element, shadowRoot } = await render();

    setStoreState({ potentialPartners: new Failure(new Error('boom')) });
    await element.updateComplete;

    expect(shadowRoot.querySelector('.general-error')).toHaveTextContent(
      'An error has occurred. Please, try again later.',
    );

    shadowRoot.querySelector('hb-dialog')!.dispatchEvent(new Event('close'));
    await element.updateComplete;

    expect(closeDialog).toHaveBeenCalled();
    expect(shadowRoot.querySelector('.general-error')).toBeNull();
  });

  it('starts empty each time it opens', async () => {
    const { element, field } = await render();
    await type(field('fullName'), 'Ada');
    await element.updateComplete;

    setStoreState({ dialogs: new Initialized() });
    await element.updateComplete;
    setStoreState({ dialogs: new Success({ name: DIALOG.PARTNER }) });
    await element.updateComplete;

    expect(field('fullName').value).toBe('');
  });

  it('ignores requests while closed', async () => {
    const { element, shadowRoot } = await render({ open: false });

    setStoreState({ potentialPartners: new Failure(new Error('boom')) });
    await element.updateComplete;

    expect(shadowRoot.querySelector('.general-error')).toBeNull();
  });
});
