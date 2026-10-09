import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { footerRelBlock } from '../../config/site';
import './footer-rel';

describe('footer-rel', () => {
  it('defines a component', () => {
    expect(customElements.get('footer-rel')).toBeDefined();
  });

  it('renders the related link columns, without a subscription form', async () => {
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
    expect(
      withinShadowRoot.getByRole('heading', { name: firstFooterBlock!.title }),
    ).toBeInTheDocument();
    expect(withinShadowRoot.getByText(externalLink.name)).toHaveAttribute('href', externalLink.url);
    expect(withinShadowRoot.getByText(externalLink.name)).toHaveAttribute('target', '_blank');
    expect(withinShadowRoot.queryByRole('textbox')).toBeNull();
  });
});
