import { describe, expect, it } from '@jest/globals';
import { html } from 'lit';
import { fixture } from '../../__tests__/helpers/fixtures';
import { location, mapBlock } from '../utils/data';
import { initialUiState } from '../store/ui/state';
import type { MapBlock } from './map-block';

import './map-block';

describe('map-block', () => {
  it('defines a component', () => {
    expect(customElements.get('map-block')).toBeDefined();
  });

  it('renders the location description and address', async () => {
    const { shadowRoot } = await fixture<MapBlock>(html`<map-block></map-block>`);

    expect(shadowRoot).toHaveTextContent(mapBlock.title);
    expect(shadowRoot).toHaveTextContent(location.description);
    expect(shadowRoot).toHaveTextContent(location.address);
    expect(shadowRoot.querySelector('a')).toHaveAttribute(
      'href',
      `https://www.google.com/maps/dir/?api=1&destination=${location.address}`,
    );
    expect(shadowRoot.querySelector('hoverboard-icon')).toHaveAttribute('name', 'directions');
  });

  it('does not render the google map when viewport is not tablet plus', async () => {
    const { element, shadowRoot } = await fixture<MapBlock>(html`<map-block></map-block>`);
    element.stateChanged({
      ui: { ...initialUiState, viewport: { ...initialUiState.viewport, isTabletPlus: false } },
    } as never);
    await element.updateComplete;

    expect(shadowRoot.querySelector('gmp-map')).toBeNull();
  });

  it('renders the google map when viewport is tablet plus', async () => {
    const { element, shadowRoot } = await fixture<MapBlock>(html`<map-block></map-block>`);
    element.stateChanged({
      ui: { ...initialUiState, viewport: { ...initialUiState.viewport, isTabletPlus: true } },
    } as never);
    await element.updateComplete;

    expect(shadowRoot.querySelector('gmp-map')).toBeInTheDocument();
    expect(shadowRoot.querySelector('gmp-advanced-marker')).toHaveAttribute('title', location.name);
  });
});
