import { Failure, Pending, Success } from '@abraham/remotedata';
import { describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { PartnerGroup } from '../../models/partner-group';
import { openPartnerDialog } from '../../store/dialogs';
import type { PartnersBlock } from './partners-block';
import './partners-block';

vi.mock('../../store/dialogs', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../store/dialogs')>()),
  openPartnerDialog: vi.fn(),
}));

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

    expect(shadowRoot.querySelector('h3.group-title')).toHaveTextContent('Gold Partners');
    const logo = shadowRoot.querySelector('a.logo');
    expect(logo).toHaveAttribute('href', 'https://example.com/partner-1');
    expect(shadowRoot.querySelector('a.logo img')).toHaveAttribute(
      'src',
      'https://example.com/logo-1.svg',
    );
    expect(shadowRoot.querySelector('.cta-button')).toHaveTextContent('Become a partner');
  });

  it('opens the partner dialog from the become a partner button', async () => {
    const { shadowRoot } = await fixture<PartnersBlock>(html`<partners-block></partners-block>`);

    shadowRoot.querySelector<HTMLElement>('hb-button')!.click();

    expect(openPartnerDialog).toHaveBeenCalled();
  });
});
