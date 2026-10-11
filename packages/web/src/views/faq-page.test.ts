import { beforeEach, describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { deepQuerySelector, screen } from 'shadow-dom-testing-library';
import { fixture } from '../../__tests__/helpers/fixtures';
import '../store';
import { faq } from '../config/site';
import { updateMetadata } from '../utils/metadata';
import './faq-page';
import { FaqPage } from './faq-page';
import { SimpleHero } from '../components/hero/simple-hero';
import { RemoteMarkDown } from '../components/markdown/remote-markdown';

vi.mock('../utils/metadata');
vi.mock('../utils/scrolling', () => ({
  scrollToTop: vi.fn(),
}));

const mockUpdateMetadata = vi.mocked(updateMetadata);

describe('faq-page', () => {
  beforeEach(() => {
    mockUpdateMetadata.mockClear();
  });

  it('defines a component', () => {
    expect(customElements.get('faq-page')).toBeDefined();
  });

  it('renders the FAQ page', async () => {
    const { element, shadowRoot } = await fixture<FaqPage>(
      html`<faq-page data-testid="page"></faq-page>`,
    );
    const hero = deepQuerySelector<SimpleHero>(shadowRoot, 'simple-hero');
    const markdown = deepQuerySelector<RemoteMarkDown>(shadowRoot, 'remote-markdown');

    expect(screen.getByTestId('page')).toBeInTheDocument();
    expect(element.source).toBe(faq);
    expect(hero?.page).toBe('faq');
    expect(markdown?.path).toBe(faq);
    expect(markdown).toHaveAttribute('toc');
    expect(markdown).toHaveAttribute('disclosures');
  });

  it('updates page metadata', async () => {
    await fixture<FaqPage>(html`<faq-page></faq-page>`);

    expect(mockUpdateMetadata).toHaveBeenCalledTimes(1);
    expect(mockUpdateMetadata).toHaveBeenCalledWith('FAQs', 'Find you answer right here!');
  });
});
