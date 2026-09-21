import { describe, expect, it, jest } from '@jest/globals';
import { fireEvent, screen } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { scrollToTop } from '../utils/scrolling';
import './footer-block';

jest.mock('../utils/scrolling', () => ({
  scrollToTop: jest.fn(),
}));

const mockScrollToTop = jest.mocked(scrollToTop);

describe('footer-block', () => {
  it('defines a component', () => {
    expect(customElements.get('footer-block')).toBeDefined();
  });

  it('renders footer children and a back-to-top action', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<footer-block data-testid="footer"></footer-block>`,
    );
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(shadowRootForWithin.querySelector('[aria-label="Back to top"]')).toBeInTheDocument();
    expect(shadowRootForWithin.querySelector('footer-social')).toBeInTheDocument();
    expect(shadowRootForWithin.querySelector('footer-rel')).toBeInTheDocument();
    expect(shadowRootForWithin.querySelector('footer-nav')).toBeInTheDocument();
  });

  it('scrolls to the top when the action is clicked', async () => {
    const { shadowRoot } = await fixture(html`<footer-block></footer-block>`);

    fireEvent.click(shadowRoot.querySelector('[aria-label="Back to top"]')!);

    expect(mockScrollToTop).toHaveBeenCalledTimes(1);
  });
});
