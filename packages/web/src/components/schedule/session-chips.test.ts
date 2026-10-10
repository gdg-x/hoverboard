import { afterEach, describe, expect, it } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { SessionChips } from './session-chips';
import './session-chips';

const render = async (props: Partial<SessionChips>) => {
  const result = await fixture<SessionChips>(html`<session-chips></session-chips>`);
  Object.assign(result.element, props);
  await result.element.updateComplete;
  const chips = [...result.shadowRoot.querySelectorAll('hb-chip')];
  return { ...result, chips, texts: chips.map((chip) => chip.textContent?.trim()) };
};

describe('session-chips', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('shows the details, then the sponsor, then the tags in their colors', async () => {
    const { chips, texts } = await render({
      details: ['January 2', 'Main hall'],
      session: { sponsor: 'Acme', tags: ['Web'] },
    });

    expect(texts).toEqual(['January 2', 'Main hall', 'Sponsored', 'Web']);
    expect(chips[0]).toHaveClass('plain');
    expect(chips[2]).toHaveAttribute('accent', '1');
    expect(chips[3]!.style.getPropertyValue('--hb-chip-color')).toContain('--hb-on-tag-web');
  });

  it('names the sponsor when asked', async () => {
    const { texts } = await render({ session: { sponsor: 'Acme' }, nameSponsor: true });

    expect(texts).toEqual(['Sponsored by Acme']);
  });

  it('names the list', async () => {
    const { shadowRoot } = await render({ session: { tags: ['Web'] }, label: 'Session details' });

    expect(shadowRoot.querySelector('ul')).toHaveAttribute('aria-label', 'Session details');
  });

  it('renders no list without chips', async () => {
    const element = document.createElement('session-chips');
    element.session = { tags: [] };
    document.body.append(element);
    await element.updateComplete;

    expect(element.shadowRoot?.querySelector('ul')).toBeNull();
    element.remove();
  });
});
