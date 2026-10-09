import { describe, expect, it } from 'vitest';
import { html } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
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
    'google',
    'website',
    'bookmark-check',
    'bookmark-plus',
    'insert-comment',
    'add-circle-outline',
    'chevron-left',
    'chevron-right',
    'play',
    'directions',
    'close',
    'filter-list',
    'menu',
    'account',
    'bell',
    'bell-off',
    'bell-outline',
    'video',
    'presentation',
    'movie',
    'ticket',
    'arrow-left',
    'calendar',
    'share',
    'coffee-break',
    'lunch',
    'location',
    'opening',
    'party',
    'people',
    'registration',
  ])('renders the %s icon', async (name) => {
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

  it('renders nothing on the first render, even for a loaded icon, as the server does', async () => {
    await fixture(html`<hoverboard-icon name="github"></hoverboard-icon>`);
    const element = document.createElement('hoverboard-icon') as HoverboardIcon;
    element.name = 'github';
    let firstRender: boolean | undefined;
    element.addController({
      hostUpdated: () => {
        firstRender ??= !!element.shadowRoot?.querySelector('svg');
      },
    });
    document.body.append(element);
    await element.updateComplete;

    expect(firstRender).toBe(false);
    expect(element.shadowRoot?.querySelector('svg')).toBeInTheDocument();
    element.remove();
  });
});
