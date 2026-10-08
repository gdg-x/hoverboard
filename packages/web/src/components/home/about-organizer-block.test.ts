import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { setFeatures } from '../../../__tests__/helpers/features';
import { aboutOrganizerBlock } from '../../config/site';
import './about-organizer-block';

describe('about-organizer-block', () => {
  it('defines a component', () => {
    expect(customElements.get('about-organizer-block')).toBeDefined();
  });

  it('renders organizer information and calls to action', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<about-organizer-block data-testid="block"></about-organizer-block>`,
    );
    const { getByText } = within(shadowRootForWithin);
    const firstBlock = aboutOrganizerBlock.blocks[0]!;

    expect(screen.getByTestId('block')).toBeInTheDocument();
    expect(getByText(firstBlock.title)).toBeInTheDocument();
    expect(getByText(firstBlock.callToAction.label)).toBeInTheDocument();
    expect(within(shadowRootForWithin).getByAltText('Organizer')).toBeInTheDocument();
    expect(shadowRootForWithin.querySelector('a.frame')).toHaveAttribute('href', '/team');
  });

  it('renders the descriptions as markdown', async () => {
    const { shadowRoot } = await fixture(html`<about-organizer-block></about-organizer-block>`);

    expect(shadowRoot.querySelector('.prose a')).toHaveAttribute('href', 'http://lviv.gdg.org.ua');
  });

  it('does not link the photo to the team page when team is off', async () => {
    setFeatures({ team: false });

    const { shadowRoot } = await fixture(html`<about-organizer-block></about-organizer-block>`);

    expect(shadowRoot.querySelector('figure.frame img')).not.toBeNull();
    expect(shadowRoot.querySelector('a.frame')).toBeNull();
  });
});
