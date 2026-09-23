import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { coc, heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './coc-page';
import { CocPage } from './coc-page';
import { SimpleHero } from './hero/simple-hero';
import { RemoteMarkDown } from './markdown/remote-markdown';

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
    const { element, shadowRootForWithin } = await fixture<CocPage>(
      html`<coc-page data-testid="page"></coc-page>`,
    );
    const hero = shadowRootForWithin.querySelector<SimpleHero>('simple-hero');
    const markdown = shadowRootForWithin.querySelector<RemoteMarkDown>('remote-markdown');

    expect(screen.getByTestId('page')).toBeInTheDocument();
    expect(element.source).toBe(coc);
    expect(hero?.page).toBe('coc');
    expect(markdown?.path).toBe(coc);
    expect(markdown).toHaveAttribute('toc');
    expect(shadowRootForWithin.querySelector('footer-block')).toBeInTheDocument();
  });

  it('updates page metadata', async () => {
    await fixture<CocPage>(html`<coc-page></coc-page>`);

    expect(mockUpdateMetadata).toHaveBeenCalledTimes(1);
    expect(mockUpdateMetadata).toHaveBeenCalledWith(
      heroSettings.coc.title,
      heroSettings.coc.metaDescription,
    );
  });
});
