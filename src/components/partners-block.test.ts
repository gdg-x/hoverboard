import { Failure, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, jest } from '@jest/globals';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { PartnerGroup } from '../models/partner-group';
import { closeDialog, openSubscribeDialog } from '../store/dialogs/actions';
import { addPotentialPartner } from '../store/potential-partners/actions';
import { queueSnackbar } from '../store/snackbars';
import { initialPotentialPartnersState } from '../store/potential-partners/state';
import { partnersBlock } from '../utils/data';
import type { PartnersBlock } from './partners-block';
import './partners-block';

jest.mock('../store/dialogs/actions', () => ({
  closeDialog: jest.fn(),
  openSubscribeDialog: jest.fn(),
}));

jest.mock('../store/potential-partners/actions', () => ({
  addPotentialPartner: jest.fn(),
}));

jest.mock('../store/snackbars', () => ({
  queueSnackbar: jest.fn(() => ({ type: 'QUEUE_SNACKBAR' })),
}));

const mockCloseDialog = mocked(closeDialog);
const mockOpenSubscribeDialog = mocked(openSubscribeDialog);
const mockAddPotentialPartner = mocked(addPotentialPartner);
const mockQueueSnackbar = mocked(queueSnackbar);

const partnerGroups: PartnerGroup[] = [
  {
    id: 'group-1',
    order: 1,
    title: 'Gold Partners',
    items: [
      {
        id: 'partner-1',
        parentId: 'group-1',
        logoUrl: 'https://example.com/logo-1.svg',
        name: 'Partner One',
        order: 1,
        url: 'https://example.com/partner-1',
      },
    ],
  },
];

describe('partners-block', () => {
  it('defines a component', () => {
    expect(customElements.get('partners-block')).toBeDefined();
  });

  it('renders the loading state', async () => {
    const { element, shadowRoot } = await fixture<PartnersBlock>(
      html`<partners-block></partners-block>`,
    );
    element.partners = new Pending();
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Loading...');
  });

  it('renders the error state', async () => {
    const { element, shadowRoot } = await fixture<PartnersBlock>(
      html`<partners-block></partners-block>`,
    );
    element.partners = new Failure(new Error('failed'));
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Error loading partners.');
  });

  it('renders partner groups and logos on success', async () => {
    const { element, shadowRoot } = await fixture<PartnersBlock>(
      html`<partners-block></partners-block>`,
    );
    element.partners = new Success(partnerGroups);
    await element.updateComplete;

    expect(shadowRoot).toHaveTextContent('Gold Partners');
    const logo = shadowRoot.querySelector('.logo-item');
    expect(logo).toHaveAttribute('href', 'https://example.com/partner-1');
    expect(shadowRoot.querySelector('lazy-image')).toHaveAttribute(
      'src',
      'https://example.com/logo-1.svg',
    );
    expect(shadowRoot.querySelector('.cta-button')).toHaveAttribute('trailing-icon');
    expect(shadowRoot.querySelector('.cta-button hoverboard-icon')).toHaveAttribute('slot', 'icon');
  });

  it('opens the subscribe dialog when clicking the become a partner button', async () => {
    mockAddPotentialPartner.mockReturnValue(jest.fn(async () => {}));
    const { shadowRoot } = await fixture<PartnersBlock>(html`<partners-block></partners-block>`);

    shadowRoot.querySelector<HTMLElement>('md-text-button')!.click();

    expect(mockOpenSubscribeDialog).toHaveBeenCalledWith(
      expect.objectContaining({ title: partnersBlock.form.title }),
    );

    const submit = mockOpenSubscribeDialog.mock.calls[0]![0].submit;
    submit({ email: 'partner@example.com' });
    expect(mockAddPotentialPartner).toHaveBeenCalledWith({ email: 'partner@example.com' });
  });

  it('closes the dialog and queues a toast when the partner is added successfully', async () => {
    const { element } = await fixture<PartnersBlock>(html`<partners-block></partners-block>`);
    element.potentialPartners = initialPotentialPartnersState;
    await element.updateComplete;
    mockCloseDialog.mockClear();
    mockQueueSnackbar.mockClear();

    element.potentialPartners = new Success(true);
    await element.updateComplete;

    expect(mockCloseDialog).toHaveBeenCalled();
    expect(mockQueueSnackbar).toHaveBeenCalledWith(partnersBlock.toast);
  });
});
