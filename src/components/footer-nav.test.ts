import { describe, expect, it } from '@jest/globals';
import { screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { codeOfConduct, organizer } from '../utils/data';
import './footer-nav';

describe('footer-nav', () => {
  it('defines a component', () => {
    expect(customElements.get('footer-nav')).toBeDefined();
  });

  it('renders organizer logo and links', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<footer-nav data-testid="footer"></footer-nav>`,
    );
    const withinShadowRoot = within(shadowRootForWithin);
    const logo = withinShadowRoot.getByAltText(organizer.name);
    const hoverboardLink = withinShadowRoot.getByText('Project Hoverboard');

    expect(screen.getByTestId('footer')).toBeInTheDocument();
    expect(logo).toBeInTheDocument();
    expect(logo).toHaveAttribute('src', '../../images/organizer-logo.svg');
    expect(hoverboardLink).toBeInTheDocument();
    expect(hoverboardLink).toHaveAttribute('href', 'https://github.com/gdg-x/hoverboard');
    expect(hoverboardLink).toHaveAttribute('target', '_blank');
    expect(hoverboardLink).toHaveAttribute('rel', 'noopener noreferrer');
  });

  it('renders code of conduct link', async () => {
    const { shadowRootForWithin } = await fixture(html`<footer-nav></footer-nav>`);
    const withinShadowRoot = within(shadowRootForWithin);
    const cocLink = withinShadowRoot.getByText(codeOfConduct);

    expect(cocLink).toBeInTheDocument();
    expect(cocLink).toHaveAttribute('href', '/coc');
  });
});
