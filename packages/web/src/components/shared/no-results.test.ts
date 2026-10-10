import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import { clearFilters } from '../../utils/filters';
import './no-results';

vi.mock('../../utils/filters', () => ({ clearFilters: vi.fn() }));

describe('no-results', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    vi.clearAllMocks();
  });

  it('shows a decorative drawing and the slotted message', async () => {
    const { element, shadowRoot } = await fixture(
      html`<no-results>No sessions match these filters.</no-results>`,
    );

    expect(shadowRoot.querySelector('.illustration')).toHaveAttribute('aria-hidden', 'true');
    expect(shadowRoot.querySelector('.illustration svg')).toBeInTheDocument();
    expect(shadowRoot.querySelector('p slot')).toBeInTheDocument();
    expect(element).toHaveTextContent('No sessions match these filters.');
  });

  it('clears the filters', async () => {
    const { shadowRoot } = await fixture(html`<no-results>Nothing</no-results>`);
    const button = shadowRoot.querySelector<HTMLElement>('hb-button')!;

    expect(button).toHaveTextContent('Clear filters');
    button.click();

    expect(clearFilters).toHaveBeenCalled();
  });
});
