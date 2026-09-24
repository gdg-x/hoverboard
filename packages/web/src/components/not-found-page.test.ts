import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { heroSettings } from '../utils/data';
import { updateMetadata } from '../utils/metadata';
import './not-found-page';
import { NotFoundPage } from './not-found-page';
import { SimpleHero } from './hero/simple-hero';

vi.mock('../utils/metadata');
vi.mock('../utils/scrolling', () => ({
  scrollToTop: vi.fn(),
}));

const mockUpdateMetadata = vi.mocked(updateMetadata);

describe('not-found-page', () => {
  beforeEach(() => {
    mockUpdateMetadata.mockClear();
  });

  it('defines a component', () => {
    expect(customElements.get('not-found-page')).toBeDefined();
  });

  it('renders the not-found page', async () => {
    const { shadowRootForWithin } = await fixture<NotFoundPage>(
      html`<not-found-page data-testid="page"></not-found-page>`,
    );
    const hero = shadowRootForWithin.querySelector<SimpleHero>('simple-hero');
    const image = shadowRootForWithin.querySelector('lazy-image');

    expect(screen.getByTestId('page')).toBeInTheDocument();
    expect(hero?.page).toBe('notFound');
    expect(image).toHaveAttribute('src', '../../images/not-found.svg');
    expect(image).toHaveAttribute('alt', heroSettings.notFound.title);
    expect(shadowRootForWithin.querySelector('footer-block')).toBeInTheDocument();
  });

  it('updates page metadata', async () => {
    await fixture<NotFoundPage>(html`<not-found-page></not-found-page>`);

    expect(mockUpdateMetadata).toHaveBeenCalledTimes(1);
    expect(mockUpdateMetadata).toHaveBeenCalledWith(
      heroSettings.notFound.title,
      heroSettings.notFound.metaDescription,
    );
  });
});
