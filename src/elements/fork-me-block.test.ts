import { describe, expect, it } from '@jest/globals';
import { screen, within } from '@testing-library/dom';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import './fork-me-block';
import { ForkMeBlock } from './fork-me-block';

describe('fork-me-block', () => {
  it('should be registered', () => {
    expect(customElements.get('fork-me-block')).toBeDefined();
  });

  it('renders default content', async () => {
    const { shadowRootForWithin } = await fixture<ForkMeBlock>(
      html`<fork-me-block data-testid="fork-me"></fork-me-block>`,
    );
    const { getByText, getByRole } = within(shadowRootForWithin);

    expect(screen.getByTestId('fork-me')).toBeInTheDocument();
    expect(getByText('Fork me on GitHub')).toBeInTheDocument();
    expect(getByText(/Hoverboard is open source conference website template/)).toBeInTheDocument();
    expect(getByText('Fork this project')).toBeInTheDocument();
    
    const link = getByRole('link');
    expect(link).toHaveAttribute('href', 'https://github.com/gdg-x/hoverboard');
  });

  it('has correct styling classes', async () => {
    const { element, shadowRoot } = await fixture<ForkMeBlock>(html`<fork-me-block></fork-me-block>`);

    expect(element).toBeInTheDocument();
    expect(shadowRoot.querySelector('.container')).toBeInTheDocument();
    expect(shadowRoot.querySelector('.container-narrow')).toBeInTheDocument();
    expect(shadowRoot.querySelector('.container-title')).toBeInTheDocument();
    expect(shadowRoot.querySelector('.cta-button')).toBeInTheDocument();
  });

  it('contains github icon', async () => {
    const { shadowRoot } = await fixture<ForkMeBlock>(html`<fork-me-block></fork-me-block>`);

    const icon = shadowRoot.querySelector('iron-icon');
    expect(icon).toBeInTheDocument();
    expect(icon).toHaveAttribute('icon', 'hoverboard:github');
  });

  it('contains material design button', async () => {
    const { shadowRoot } = await fixture<ForkMeBlock>(html`<fork-me-block></fork-me-block>`);

    const button = shadowRoot.querySelector('md-outlined-button');
    expect(button).toBeInTheDocument();
    expect(button).toHaveClass('icon-right');
  });
});