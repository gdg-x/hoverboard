import { beforeEach, describe, expect, it } from '@jest/globals';
import { screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import './fork-me-block';

describe('fork-me-block', () => {
  beforeEach(() => {
    // Clear any existing custom elements if needed
  });

  it('defines a component', () => {
    expect(customElements.get('fork-me-block')).toBeDefined();
  });

  it('renders the fork me content', async () => {
    const { shadowRootForWithin } = await fixture(
      html`<fork-me-block data-testid="fork-block"></fork-me-block>`,
    );
    const { getByText } = within(shadowRootForWithin);

    expect(screen.getByTestId('fork-block')).toBeInTheDocument();
    expect(getByText('Fork me on GitHub')).toBeInTheDocument();
    expect(getByText('Fork this project')).toBeInTheDocument();
    expect(getByText(/Hoverboard is open source conference website template/)).toBeInTheDocument();
  });

  it('renders the GitHub link correctly', async () => {
    const { shadowRootForWithin } = await fixture(html`<fork-me-block></fork-me-block>`);
    const { getByRole } = within(shadowRootForWithin);

    const link = getByRole('link');
    expect(link).toHaveAttribute('href', 'https://github.com/gdg-x/hoverboard');
  });

  it('has proper styling classes', async () => {
    const { shadowRootForWithin } = await fixture(html`<fork-me-block></fork-me-block>`);
    const { getByText } = within(shadowRootForWithin);

    const container = getByText('Fork me on GitHub').closest('.container');
    expect(container).toHaveClass('container', 'container-narrow');

    const button = getByText('Fork this project').closest('md-outlined-button');
    expect(button).toHaveClass('icon-right');
  });
});
