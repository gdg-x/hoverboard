import { describe, expect, it } from '@jest/globals';
import { screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import './fork-me-block';

describe('fork-me-block', () => {
  it('defines a component', () => {
    expect(customElements.get('fork-me-block')).toBeDefined();
  });

  it('renders a link to the GitHub repository', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<fork-me-block data-testid="fork-me"></fork-me-block>`,
    );
    const { getByText } = within(shadowRootForWithin);

    expect(screen.getByTestId('fork-me')).toBeInTheDocument();
    expect(getByText('Fork this project')).toBeInTheDocument();

    const link = shadowRootForWithin.querySelector('a');
    expect(link).toHaveAttribute('href', 'https://github.com/gdg-x/hoverboard');
  });
});
