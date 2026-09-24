import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent, screen } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { emailUs, mailto, organizer, socialNetwork } from '../utils/data';
import { share } from '../utils/share';
import './footer-social';

vi.mock('../utils/share');

const mockShare = vi.mocked(share);

describe('footer-social', () => {
  beforeEach(() => {
    mockShare.mockClear();
  });

  it('defines a component', () => {
    expect(customElements.get('footer-social')).toBeDefined();
  });

  it('renders share buttons that call share on click', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<footer-social data-testid="footer-social"></footer-social>`,
    );

    expect(screen.getByTestId('footer-social')).toBeInTheDocument();

    const facebookButton = shadowRootForWithin.querySelector('[aria-label="Share on Facebook"]')!;
    fireEvent.click(facebookButton);
    expect(mockShare).toHaveBeenCalledTimes(1);

    const twitterButton = shadowRootForWithin.querySelector('[aria-label="Share on Twitter"]')!;
    fireEvent.click(twitterButton);
    expect(mockShare).toHaveBeenCalledTimes(2);
  });

  it('renders a social network link for each entry', async () => {
    const { shadowRootForWithin } = await fixture(html`<footer-social></footer-social>`);

    for (const { name, url } of socialNetwork.follow) {
      const link = shadowRootForWithin.querySelector(`[aria-label="${name}"]`)?.closest('a');
      expect(link).toHaveAttribute('href', url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('renders the email link', async () => {
    const { shadowRootForWithin } = await fixture(html`<footer-social></footer-social>`);

    const emailLink = shadowRootForWithin.querySelector(`[aria-label="${emailUs}"]`);
    expect(emailLink).toHaveAttribute('href', `mailto:${mailto}`);
  });

  it('renders the blog link', async () => {
    const { shadowRootForWithin } = await fixture(html`<footer-social></footer-social>`);
    const blogLink = shadowRootForWithin.querySelector('.blog a');

    expect(blogLink).toHaveAttribute('href', organizer.blog);
  });
});
