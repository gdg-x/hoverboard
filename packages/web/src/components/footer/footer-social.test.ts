import { beforeEach, describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { screen } from 'shadow-dom-testing-library';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { mailto, organizer, socialNetwork } from '../../config/site';
import { share } from '../../utils/share';
import './footer-social';

vi.mock('../../utils/share');

const mockShare = vi.mocked(share);

describe('footer-social', () => {
  beforeEach(() => {
    mockShare.mockClear();
  });

  it('defines a component', () => {
    expect(customElements.get('footer-social')).toBeDefined();
  });

  it('renders share buttons that call share on click', async () => {
    await fixture(html`<footer-social data-testid="footer-social"></footer-social>`);

    expect(screen.getByTestId('footer-social')).toBeInTheDocument();

    fireEvent.click(await screen.findByShadowRole('button', { name: 'Share on Facebook' }));
    expect(mockShare).toHaveBeenCalledTimes(1);

    fireEvent.click(screen.getByShadowRole('button', { name: 'Share on Twitter' }));
    expect(mockShare).toHaveBeenCalledTimes(2);
  });

  it('renders a social network link for each entry', async () => {
    await fixture(html`<footer-social></footer-social>`);

    for (const { name, url } of socialNetwork.follow) {
      const link = await screen.findByShadowRole('link', { name });
      expect(link).toHaveAttribute('href', url);
      expect(link).toHaveAttribute('target', '_blank');
      expect(link).toHaveAttribute('rel', 'noopener noreferrer');
    }
  });

  it('renders the email link', async () => {
    await fixture(html`<footer-social></footer-social>`);

    expect(screen.getByShadowRole('link', { name: 'Email us' })).toHaveAttribute(
      'href',
      `mailto:${mailto}`,
    );
  });

  it('renders the blog link', async () => {
    await fixture(html`<footer-social></footer-social>`);

    expect(screen.getByShadowRole('link', { name: 'Blog' })).toHaveAttribute(
      'href',
      organizer.blog,
    );
  });

  it('leaves out the blog link when the organizer has no blog', async () => {
    const { blog } = organizer;
    delete (organizer as { blog?: string }).blog;

    try {
      await fixture(html`<footer-social></footer-social>`);

      expect(screen.queryByShadowRole('link', { name: 'Blog' })).not.toBeInTheDocument();
    } finally {
      organizer.blog = blog;
    }
  });
});
