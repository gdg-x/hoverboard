import { describe, expect, it, vi } from 'vitest';
import { fireEvent } from '@testing-library/dom';
import { html } from 'lit';
import { deepQuerySelector, screen } from 'shadow-dom-testing-library';
import { setFeatures } from '../../../__tests__/helpers/features';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { title } from '../../config/site';
import { scrollToTop } from '../../utils/scrolling';
import type { FooterBlock } from './footer-block';
import './footer-block';

vi.mock('../../utils/scrolling', () => ({
  scrollToTop: vi.fn(),
}));

const mockScrollToTop = vi.mocked(scrollToTop);

describe('footer-block', () => {
  it('defines a component', () => {
    expect(customElements.get('footer-block')).toBeDefined();
  });

  it('renders footer children and a back-to-top action', async () => {
    const { shadowRoot } = await fixture(html`<footer-block data-testid="footer"></footer-block>`);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(await screen.findByShadowRole('button', { name: 'Back to top' })).toBeInTheDocument();
    expect(deepQuerySelector(shadowRoot, 'footer-social')).toBeInTheDocument();
    expect(deepQuerySelector(shadowRoot, 'footer-rel')).toBeInTheDocument();
    expect(deepQuerySelector(shadowRoot, 'footer-nav')).toBeInTheDocument();
    expect(deepQuerySelector(shadowRoot, 'locale-picker')).toBeInTheDocument();
  });

  it('scrolls to the top when the action is clicked', async () => {
    await fixture(html`<footer-block></footer-block>`);

    fireEvent.click(await screen.findByShadowRole('button', { name: 'Back to top' }));

    expect(mockScrollToTop).toHaveBeenCalledTimes(1);
  });

  it('shows the event name, the appearance toggle and a link to the subscribe band', async () => {
    const { shadowRoot } = await fixture(html`<footer-block></footer-block>`);

    expect(screen.getByShadowRole('contentinfo')).toHaveTextContent(title);
    expect(deepQuerySelector(shadowRoot, 'color-scheme-toggle')).toBeInTheDocument();
    expect(screen.getByShadowRole('link', { name: 'Get updates by email' })).toHaveAttribute(
      'href',
      '/#subscribe',
    );
  });

  it('leaves out the subscribe link when subscribing is off', async () => {
    setFeatures({ subscribe: false });
    await fixture(html`<footer-block></footer-block>`);

    expect(
      screen.queryByShadowRole('link', { name: 'Get updates by email' }),
    ).not.toBeInTheDocument();
  });

  it('shows the fork me sticker only when the feature is on', async () => {
    setFeatures({ forkMe: false });
    const { element, shadowRoot } = await fixture<FooterBlock>(html`<footer-block></footer-block>`);
    expect(deepQuerySelector(shadowRoot, 'hb-sticker')).toBeNull();

    setFeatures({ forkMe: true });
    element.requestUpdate();
    await element.updateComplete;

    expect(await screen.findByShadowRole('link', { name: 'Fork me on GitHub' })).toHaveAttribute(
      'href',
      'https://github.com/gdg-x/hoverboard',
    );
  });
});
