import { beforeEach, describe, expect, it, vi } from 'vitest';
import { html } from 'lit';
import { deepQuerySelector, screen } from 'shadow-dom-testing-library';
import { fixture } from '../../__tests__/helpers/fixtures';
import '../store';
import { coc } from '../config/site';
import { updateMetadata } from '../utils/metadata';
import './coc-page';
import { CocPage } from './coc-page';
import { SimpleHero } from '../components/hero/simple-hero';
import { RemoteMarkDown } from '../components/markdown/remote-markdown';

vi.mock('../utils/metadata');
vi.mock('../utils/scrolling', () => ({
  scrollToTop: vi.fn(),
}));

const mockUpdateMetadata = vi.mocked(updateMetadata);

describe('coc-page', () => {
  beforeEach(() => {
    mockUpdateMetadata.mockClear();
  });

  it('defines a component', () => {
    expect(customElements.get('coc-page')).toBeDefined();
  });

  it('renders the code of conduct page', async () => {
    const { element, shadowRoot } = await fixture<CocPage>(
      html`<coc-page data-testid="page"></coc-page>`,
    );
    const hero = deepQuerySelector<SimpleHero>(shadowRoot, 'simple-hero');
    const markdown = deepQuerySelector<RemoteMarkDown>(shadowRoot, 'remote-markdown');

    expect(screen.getByTestId('page')).toBeInTheDocument();
    expect(element.source).toBe(coc);
    expect(hero?.page).toBe('coc');
    expect(markdown?.path).toBe(coc);
    expect(markdown).toHaveAttribute('toc');
  });

  it('updates page metadata', async () => {
    await fixture<CocPage>(html`<coc-page></coc-page>`);

    expect(mockUpdateMetadata).toHaveBeenCalledTimes(1);
    expect(mockUpdateMetadata).toHaveBeenCalledWith(
      'Code of Conduct',
      'Learn more about our expectations for all those who participate in our community',
    );
  });
});
