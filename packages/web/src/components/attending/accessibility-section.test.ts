import { afterEach, describe, expect, it, vi } from 'vitest';
import { html, nothing, render as litRender } from 'lit';
import { fixture } from '../../../__tests__/helpers/fixtures';
import type { AccessibilitySection } from './accessibility-section';
import './accessibility-section';

const config = vi.hoisted(() => ({ accessibility: undefined as string | undefined }));

vi.mock('../../config/site', async (importOriginal) => ({
  ...(await importOriginal<typeof import('../../config/site')>()),
  get attendingPage() {
    return { accessibility: config.accessibility };
  },
}));

const render = async () => {
  const result = await fixture<AccessibilitySection>(html`
    <accessibility-section><h2 slot="heading">Accessibility</h2></accessibility-section>
  `);
  await result.element.updateComplete;
  return result;
};

describe('accessibility-section', () => {
  afterEach(() => {
    litRender(nothing, document.body);
    config.accessibility = undefined;
  });

  it('renders nothing without text', async () => {
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('slot, .text')).toBeNull();
  });

  it("shows the organizers' text as markdown after the heading", async () => {
    config.accessibility = 'Every room is **step-free**.';
    const { shadowRoot } = await render();

    expect(shadowRoot.querySelector('slot[name="heading"]')).not.toBeNull();
    expect(shadowRoot.querySelector('.text strong')).toHaveTextContent('step-free');
  });
});
