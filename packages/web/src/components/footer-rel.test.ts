import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { footerRelBlock, notifications, subscribeNote } from '../utils/data';
import './footer-rel';

describe('footer-rel', () => {
  it('defines a component', () => {
    expect(customElements.get('footer-rel')).toBeDefined();
  });

  it('renders related links and the subscription form', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<footer-rel data-testid="footer-rel"></footer-rel>`,
    );
    const withinShadowRoot = within(shadowRootForWithin);
    const firstFooterBlock = footerRelBlock[0];
    const externalLink = footerRelBlock
      .flatMap((block) => block.links)
      .find((link) => link.newTab)!;

    expect(screen.getByTestId('footer-rel')).toBeInTheDocument();
    expect(firstFooterBlock).toBeDefined();
    expect(withinShadowRoot.getByText(firstFooterBlock!.title)).toBeInTheDocument();
    expect(withinShadowRoot.getByText(externalLink.name)).toHaveAttribute('href', externalLink.url);
    expect(withinShadowRoot.getByText(externalLink.name)).toHaveAttribute('target', '_blank');
    expect(withinShadowRoot.getByText(notifications.subscribe)).toBeInTheDocument();
    expect(withinShadowRoot.getByText(subscribeNote)).toBeInTheDocument();
    expect(shadowRootForWithin.querySelector('subscribe-form-footer')).toBeInTheDocument();
  });
});
