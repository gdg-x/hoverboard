import { describe, expect, it } from 'vitest';
import { html } from 'lit';
import { deepQuerySelector, screen } from 'shadow-dom-testing-library';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setFeatures } from '../../../__tests__/helpers/features';
import { aboutOrganizerBlock } from '../../config/site';
import './about-organizer-block';

describe('about-organizer-block', () => {
  it('defines a component', () => {
    expect(customElements.get('about-organizer-block')).toBeDefined();
  });

  it('renders organizer information and calls to action', async () => {
    await fixture(html`<about-organizer-block data-testid="block"></about-organizer-block>`);
    const firstBlock = aboutOrganizerBlock.blocks[0]!;

    expect(screen.getByTestId('block')).toBeInTheDocument();
    expect(screen.getByShadowText(firstBlock.title)).toBeInTheDocument();
    expect(screen.getByShadowText(firstBlock.callToAction.label)).toBeInTheDocument();
    expect(screen.getByShadowAltText('Organizer')).toBeInTheDocument();
    expect(screen.getByShadowRole('link', { name: 'Organizer' })).toHaveAttribute('href', '/team');
  });

  it('renders the descriptions as markdown', async () => {
    const { shadowRoot } = await fixture(html`<about-organizer-block></about-organizer-block>`);

    expect(deepQuerySelector(shadowRoot, '.prose a')).toHaveAttribute(
      'href',
      'http://lviv.gdg.org.ua',
    );
  });

  it('does not link the photo to the team page when team is off', async () => {
    setFeatures({ team: false });

    const { shadowRoot } = await fixture(html`<about-organizer-block></about-organizer-block>`);

    expect(deepQuerySelector(shadowRoot, 'figure.frame img')).not.toBeNull();
    expect(screen.queryByShadowRole('link', { name: 'Organizer' })).not.toBeInTheDocument();
  });
});
