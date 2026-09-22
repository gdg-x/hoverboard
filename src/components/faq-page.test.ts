import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import { screen } from '@testing-library/dom';
import { mocked } from 'jest-mock';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { faq, heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './faq-page';
import { FaqPage } from './faq-page';
import { SimpleHero } from './hero/simple-hero';
import { RemoteMarkDown } from './markdown/remote-markdown';

jest.mock('../utils/metadata');
jest.mock('../utils/scrolling', () => ({
  scrollToTop: jest.fn(),
}));

const mockUpdateMetadata = mocked(updateMetadata);

describe('faq-page', () => {
  beforeEach(() => {
    mockUpdateMetadata.mockClear();
  });

  it('defines a component', () => {
    expect(customElements.get('faq-page')).toBeDefined();
  });

  it('renders the FAQ page', async () => {
    const { element, shadowRootForWithin } = await fixture<FaqPage>(
      html`<faq-page data-testid="page"></faq-page>`,
    );
    const hero = shadowRootForWithin.querySelector<SimpleHero>('simple-hero');
    const markdown = shadowRootForWithin.querySelector<RemoteMarkDown>('remote-markdown');

    expect(screen.getByTestId('page')).toBeInTheDocument();
    expect(element.source).toBe(faq);
    expect(hero?.page).toBe('faq');
    expect(markdown?.path).toBe(faq);
    expect(markdown).toHaveAttribute('toc');
    expect(shadowRootForWithin.querySelector('footer-block')).toBeInTheDocument();
  });

  it('updates page metadata', async () => {
    await fixture<FaqPage>(html`<faq-page></faq-page>`);

    expect(mockUpdateMetadata).toHaveBeenCalledTimes(1);
    expect(mockUpdateMetadata).toHaveBeenCalledWith(
      heroSettings.faq.title,
      heroSettings.faq.metaDescription,
    );
  });
});
