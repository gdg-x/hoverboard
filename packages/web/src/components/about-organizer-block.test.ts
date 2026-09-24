import { describe, expect, it } from 'vitest';
import { screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { aboutOrganizerBlock } from '../utils/data';
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
    expect(shadowRootForWithin.querySelector('lazy-image')).toBeInTheDocument();
  });
});
