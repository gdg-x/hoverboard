import { html, nothing, render as litRender } from 'lit';
import { afterEach, describe, expect, it } from 'vitest';
import { expectNoAxeViolations } from '../../../__tests__/helpers/axe';
import { setFeatures } from '../../../__tests__/helpers/features';
import { fixture } from '../../../__tests__/helpers/fixtures';
import './coming-soon';

describe('coming-soon', () => {
  afterEach(() => {
    litRender(nothing, document.body);
  });

  it('shows the slotted message and a link to get updates', async () => {
    const { element, shadowRoot } = await fixture(
      html`<coming-soon>Speakers are coming soon.</coming-soon>`,
    );

    expect(element).toHaveTextContent('Speakers are coming soon.');
    expect(shadowRoot.querySelector('p slot')).toBeInTheDocument();
    const button = shadowRoot.querySelector('hb-button');
    expect(button).toHaveTextContent('Get updates');
    expect(button).toHaveAttribute('href', '/#subscribe');
    await expectNoAxeViolations(element);
  });

  it('has no link to get updates when subscribe is off', async () => {
    setFeatures({ subscribe: false });

    const { element, shadowRoot } = await fixture(
      html`<coming-soon>The schedule is coming soon.</coming-soon>`,
    );

    expect(shadowRoot.querySelector('hb-button')).toBeNull();
    await expectNoAxeViolations(element);
  });
});
