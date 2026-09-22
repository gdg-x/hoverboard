import { describe, expect, it } from '@jest/globals';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { HoverboardIcon } from './hoverboard-icon';
import './hoverboard-icon';

describe('hoverboard-icon', () => {
  it('defines a component', () => {
    expect(customElements.get('hoverboard-icon')).toBeDefined();
  });

  it('renders an svg for a known icon name', async () => {
    const { shadowRoot } = await fixture(html`<hoverboard-icon name="github"></hoverboard-icon>`);

    const svg = shadowRoot.querySelector('svg');
    expect(svg).toBeInTheDocument();
    expect(svg?.querySelector('path')).toBeInTheDocument();
  });

  it.each([
    'linkedin',
    'gde',
    'gdg',
    'google',
    'website',
    'checked',
    'up',
    'bookmark-check',
    'bookmark-plus',
    'insert-comment',
    'add-circle-outline',
  ])('renders the %s social icon', async (name) => {
    const { shadowRoot } = await fixture(html`<hoverboard-icon name="${name}"></hoverboard-icon>`);

    expect(shadowRoot.querySelector('svg')).toBeInTheDocument();
  });

  it('renders nothing for an unknown icon name', async () => {
    const element = document.createElement('hoverboard-icon') as HoverboardIcon;
    element.name = 'not-real';
    document.body.append(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('svg')).toBeNull();

    element.remove();
  });
});
